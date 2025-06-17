import 'dotenv/config';
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import admin from 'firebase-admin';
import { Buffer } from 'buffer';
import { htmlToText } from 'html-to-text';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fetchFlight } from 'flightradar24-client';
import nodemailer from 'nodemailer';

// Configuration du logging
const logFile = path.join(process.cwd(), 'logs', 'imap.log');

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(path.join(process.cwd(), 'logs'))) {
  fs.mkdirSync(path.join(process.cwd(), 'logs'));
}

// Fonction de logging améliorée
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Log dans la console avec encodage UTF-8
  console.log(message);
  
  // Log dans le fichier avec encodage UTF-8
  try {
    // Créer le dossier logs s'il n'existe pas
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    // Écrire le BOM seulement si le fichier n'existe pas
    if (!fs.existsSync(logFile)) {
      const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
      fs.writeFileSync(logFile, bom);
    }

    // Ajouter le message avec encodage UTF-8
    fs.appendFileSync(logFile, logMessage, { encoding: 'utf8' });
  } catch (error) {
    console.error('Erreur lors de l\'écriture du log:', error);
  }
}

console.log('=== VERSION IMAP.JS DU', new Date().toISOString());
log('=== VERSION IMAP.JS DU ' + new Date().toISOString());

// 🔐 Initialiser Firebase depuis la clé base64
console.log('FIREBASE_KEY:', process.env.FIREBASE_KEY ? 'OK' : 'ABSENT');
if (!admin.apps.length) {
  const base64Key = process.env.FIREBASE_KEY;
  if (!base64Key) throw new Error('❌ FIREBASE_KEY manquante. Ajoute-la dans les GitHub Secrets.');
  const serviceAccount = JSON.parse(Buffer.from(base64Key, 'base64').toString('utf-8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const config = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: process.env.EMAIL_HOST,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 30000,
    // keepalive: true, // Désactivé pour le mode batch CI/CD
    // keepaliveInterval: 10000, // Désactivé pour le mode batch CI/CD
    connTimeout: 30000,
    debug: console.log
  }
};

// Cache pour FlightRadar24
const fr24Cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendUserNotificationEmail(to, subject, html, text) {
  const mailOptions = {
    from: `"BoB Plans" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  };
  try {
    log(`⏳ Tentative d'envoi d'email à ${to} : ${subject}`);
    await transporter.sendMail(mailOptions);
    log(`📧 Email envoyé à ${to} : ${subject}`);
  } catch (e) {
    log(`❌ Erreur envoi email à ${to} :`, e && (e.stack || e.message || JSON.stringify(e)));
  }
}

async function checkEmails() {
  log("🚀 Début script checkEmails");

  try {
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');
    log("📬 Inbox ouverte");

    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: [''], markSeen: true };
    const results = await connection.search(searchCriteria, fetchOptions);
    log("Nombre d'emails trouvés : " + results.length);

    if (results.length === 0) {
      log("📭 Aucun nouvel email à traiter");
      await connection.end();
      log("✅ Script terminé avec succès");
      process.exit(0);
    }

    let processedCount = 0;
    let errorCount = 0;

    for (const item of results) {
      try {
        const part = item.parts.find(p => p.which === '');
        if (!part || !part.body) {
          log("⚠️ Email sans corps ignoré");
          continue;
        }

        log("📧 Traitement de l'email " + (processedCount + 1) + "/" + results.length);
        const parsed = await simpleParser(part.body);

        const fromEmail = parsed.from?.value?.[0]?.address;
        const toEmail = parsed.to?.value?.[0]?.address;
        const subject = parsed.subject || '';
        let rawText = '';
        if (parsed.text) {
          rawText = parsed.text;
        } else if (parsed.html) {
          rawText = htmlToText(parsed.html, { wordwrap: false, ignoreHref: true, ignoreImage: true });
        } else {
          rawText = '';
        }

        // Filtrer sur le destinataire
        if (toEmail !== 'bobplans@sunshine-adventures.net') {
          log('⏩ Email ignoré, destinataire non valide : ' + toEmail);
          continue;
        }

        log('📧 Email de : ' + fromEmail);
        log('📝 Sujet : ' + subject);
        log('📄 Texte : ' + rawText.slice(0, 100));

        let tripItObj = null;
        let parsingMethod = 'unknown'; // Initialisation par défaut

        // Extraction booking ref depuis le sujet et le corps
        let bookingRefFromSubject = '';
        let bookingRefFromBody = '';
        const refRegex = /([A-Z0-9]{6,})/g;
        // Chercher dans le sujet (ex: "Votre réservation ABC1234")
        if (subject) {
          const match = subject.match(refRegex);
          if (match) {
            bookingRefFromSubject = match[0];
            log(`🔎 Booking ref trouvée dans le sujet : ${bookingRefFromSubject}`);
          }
        }
        // Chercher dans le corps (méthode existante)
        const refMatchBody = rawText.match(/référence de réservation[:\s]+([A-Z0-9]{6,})/i);
        if (refMatchBody) {
          bookingRefFromBody = refMatchBody[1];
          log(`🔎 Booking ref trouvée dans le corps : ${bookingRefFromBody}`);
        }
        // Priorité au sujet, sinon corps, sinon champs existants
        let bookingRef = bookingRefFromSubject || bookingRefFromBody || '';

        // 1. Essai du parsing EasyJet spécifique
        if (fromEmail && fromEmail.toLowerCase().includes('easyjet') || subject && subject.toLowerCase().includes('easyjet')) {
          log('🛫 Tentative parsing EasyJet spécifique...');
          tripItObj = parseEasyJetEmail(rawText);
          if (tripItObj && tripItObj.air_segments && tripItObj.air_segments.length > 0) {
            parsingMethod = 'easyjet';
            log('✅ Parsing EasyJet réussi');
            log(`✈️ Segments extraits : ${JSON.stringify(tripItObj.air_segments, null, 2)}`);
          }
        }

        // 2. Si EasyJet échoue, essai du parsing TripIt-like
        if (!tripItObj || !tripItObj.air_segments || tripItObj.air_segments.length === 0) {
          log('🛫 Tentative parsing TripIt-like...');
          tripItObj = parseTripItStyleFromEmail(rawText);
          if (tripItObj && tripItObj.air_segments && tripItObj.air_segments.length > 0) {
            parsingMethod = 'tripit';
            log('✅ Parsing TripIt-like réussi');
            log(`✈️ Segments extraits : ${JSON.stringify(tripItObj.air_segments, null, 2)}`);
          }
        }

        // 3. Si TripIt échoue, essai du parsing classique
        if (!tripItObj || !tripItObj.air_segments || tripItObj.air_segments.length === 0) {
          log('🛫 Tentative parsing classique...');
          const classicResult = extractTripInfo(rawText);
          if (classicResult) {
            tripItObj = {
              air_segments: [{
                departure_city: 'Départ',
                arrival_city: classicResult.destination,
                departure_time: classicResult.depart,
                arrival_time: classicResult.retour,
                status: 'confirmed'
              }]
            };
            parsingMethod = 'classic';
            log('✅ Parsing classique réussi');
            log(`✈️ Segments extraits : ${JSON.stringify(tripItObj.air_segments, null, 2)}`);
          }
        }

        // 4. Si tout échoue, essai du parsing IA
        if (!tripItObj || !tripItObj.air_segments || tripItObj.air_segments.length === 0) {
          log('🤖 Tentative parsing IA...');
          const aiResult = await extractTripInfoAI(rawText);
          if (aiResult) {
            tripItObj = {
              air_segments: [{
                departure_city: 'Départ',
                arrival_city: aiResult.destination,
                departure_time: aiResult.depart,
                arrival_time: aiResult.retour,
                status: 'confirmed'
              }]
            };
            parsingMethod = 'ai';
            log('✅ Parsing IA réussi');
            log(`✈️ Segments extraits : ${JSON.stringify(tripItObj.air_segments, null, 2)}`);
          }
        }

        // Vérification finale et création ou mise à jour du voyage
        if (tripItObj && tripItObj.air_segments && tripItObj.air_segments.length > 0) {
          // Enrichir chaque segment de vol si besoin
          for (let i = 0; i < tripItObj.air_segments.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            tripItObj.air_segments[i] = await enrichFlightSegmentWithFR24(tripItObj.air_segments[i]);
          }
          const seg = tripItObj.air_segments[0];
          const departDate = new Date(seg.departure_time);
          const retourDate = new Date(seg.arrival_time);
          
          // Extraction exhaustive des champs principaux
          const recordLocator = bookingRef || tripItObj.record_locator || tripItObj.trip_id || seg.confirmation_number || seg.booking_ref || '';
          log(`🔎 recordLocator final utilisé : ${recordLocator}`);
          const title = tripItObj.title || `Voyage à ${seg.arrival_city || seg.arrival_airport_name || ''}`;
          const status = tripItObj.status || seg.status || 'confirmed';
          const parsingMethod = parsingMethod || 'unknown';
          const rawEmail = tripItObj.raw_email || rawText;
          const subject = subject || '';
          const links = tripItObj.links || [];
          const carRental = tripItObj.car_rental || null;
          const hotels = tripItObj.hotels || [];
          const payments = tripItObj.payments || [];
          const passengers = tripItObj.passengers || [];
          const ownerEmail = fromEmail;

          // Ajout du texte brut à chaque bloc si possible
          tripItObj.raw_email = rawEmail;
          tripItObj.subject = subject;
          tripItObj.links = links;
          tripItObj.car_rental = carRental;
          tripItObj.hotels = hotels;
          tripItObj.payments = payments;
          tripItObj.passengers = passengers;
          tripItObj.status = status;
          tripItObj.title = title;
          tripItObj.record_locator = recordLocator;
          tripItObj.owner_email = ownerEmail;
          tripItObj.updatedAt = admin.firestore.FieldValue.serverTimestamp();
          if (!tripItObj.createdAt) tripItObj.createdAt = admin.firestore.FieldValue.serverTimestamp();
          // Ajout du texte brut à chaque segment
          tripItObj.air_segments = tripItObj.air_segments.map(seg => ({
            ...seg,
            raw_segment: JSON.stringify(seg)
          }));
          // Ajout du texte brut à la location de voiture
          if (tripItObj.car_rental && typeof tripItObj.car_rental === 'object') {
            tripItObj.car_rental.raw_car = JSON.stringify(tripItObj.car_rental);
          }
          // Ajout du texte brut à chaque hôtel
          if (Array.isArray(tripItObj.hotels)) {
            tripItObj.hotels = tripItObj.hotels.map(h => ({ ...h, raw_hotel: JSON.stringify(h) }));
          }
          // Ajout du texte brut à chaque paiement
          if (Array.isArray(tripItObj.payments)) {
            tripItObj.payments = tripItObj.payments.map(p => ({ ...p, raw_payment: JSON.stringify(p) }));
          }
          // Ajout du texte brut à chaque passager
          if (Array.isArray(tripItObj.passengers)) {
            tripItObj.passengers = tripItObj.passengers.map(p => ({ ...p, raw_passenger: JSON.stringify(p) }));
          }

          if (!isNaN(departDate.getTime()) && !isNaN(retourDate.getTime())) {
            log(`✅ Prêt à sauvegarder le voyage (record_locator: ${recordLocator})`);
            const userSnapshot = await db.collection('users')
              .where('email', '==', fromEmail)
              .get();
            
            if (!userSnapshot.empty) {
              const userDoc = userSnapshot.docs[0];
              const uid = userDoc.id;
              // Recherche d'un trip existant avec le même record_locator et ownerId
              const tripQuery = await db.collection('trips')
                .where('record_locator', '==', recordLocator)
                .where('ownerId', '==', uid)
                .get();
              if (!tripQuery.empty) {
                // Mise à jour du voyage existant
                const tripDoc = tripQuery.docs[0];
                await tripDoc.ref.update({
                  ...tripItObj,
                  title,
                  start: admin.firestore.Timestamp.fromDate(departDate),
                  end: admin.firestore.Timestamp.fromDate(retourDate),
                  ownerId: uid,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                log(`📝 Voyage mis à jour (record_locator: ${recordLocator}, ownerId: ${uid})`);
                // log('⏳ Appel sendUserNotificationEmail (succès : update)...');
                // await sendUserNotificationEmail(
                //   fromEmail,
                //   "Votre voyage a bien été ajouté !",
                //   `<p>Bonjour,<br>Votre voyage a bien été ajouté à l'app BoB.<br><a href=\"https://bob-app-url\">Voir mes voyages</a></p>`,
                //   "Bonjour, votre voyage a bien été ajouté à l'app BoB. Voir mes voyages : https://bob-app-url"
                // );
                // log('✅ Retour de sendUserNotificationEmail (succès : update)');
              } else {
                // Création d'un nouveau voyage
                await db.collection('trips').add({
                  ...tripItObj,
                  title,
                  start: admin.firestore.Timestamp.fromDate(departDate),
                  end: admin.firestore.Timestamp.fromDate(retourDate),
                  ownerId: uid,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                log(`🆕 Nouveau voyage créé (record_locator: ${recordLocator}, ownerId: ${uid})`);
                // log('⏳ Appel sendUserNotificationEmail (succès : création)...');
                // await sendUserNotificationEmail(
                //   fromEmail,
                //   "Votre voyage a bien été ajouté !",
                //   `<p>Bonjour,<br>Votre voyage a bien été ajouté à l'app BoB.<br><a href=\"https://bob-app-url\">Voir mes voyages</a></p>`,
                //   "Bonjour, votre voyage a bien été ajouté à l'app BoB. Voir mes voyages : https://bob-app-url"
                // );
                // log('✅ Retour de sendUserNotificationEmail (succès : création)');
              }
            } else {
              log("👤 Utilisateur inconnu :", fromEmail);
              // log('⏳ Appel sendUserNotificationEmail (échec : utilisateur inconnu)...');
              // await sendUserNotificationEmail(
              //   fromEmail,
              //   "Erreur lors de l'ajout de votre voyage",
              //   `<p>Bonjour,<br>Nous n'avons pas pu ajouter votre voyage automatiquement (utilisateur inconnu).<br>Merci de vérifier votre email ou de saisir manuellement dans l'app BoB.</p>`,
              //   "Bonjour, nous n'avons pas pu ajouter votre voyage automatiquement (utilisateur inconnu). Merci de vérifier votre email ou de saisir manuellement dans l'app BoB."
              // );
              // log('✅ Retour de sendUserNotificationEmail (échec : utilisateur inconnu)');
            }
          } else {
            log("❌ Dates invalides dans le résultat du parsing");
            // log('⏳ Appel sendUserNotificationEmail (échec : dates invalides)...');
            // await sendUserNotificationEmail(
            //   fromEmail,
            //   "Erreur lors de l'ajout de votre voyage",
            //   `<p>Bonjour,<br>Nous n'avons pas pu ajouter votre voyage automatiquement (dates invalides).<br>Merci de vérifier votre email ou de saisir manuellement dans l'app BoB.</p>`,
            //   "Bonjour, nous n'avons pas pu ajouter votre voyage automatiquement (dates invalides). Merci de vérifier votre email ou de saisir manuellement dans l'app BoB."
            // );
            // log('✅ Retour de sendUserNotificationEmail (échec : dates invalides)');
          }
        } else {
          log('❌ Aucune méthode de parsing n\'a réussi');
          // log('⏳ Appel sendUserNotificationEmail (échec : parsing)...');
          // await sendUserNotificationEmail(
          //   fromEmail,
          //   "Erreur lors de l'ajout de votre voyage",
          //   `<p>Bonjour,<br>Nous n'avons pas pu ajouter votre voyage automatiquement (aucune méthode de parsing n'a réussi).<br>Merci de vérifier votre email ou de saisir manuellement dans l'app BoB.</p>`,
          //   "Bonjour, nous n'avons pas pu ajouter votre voyage automatiquement (aucune méthode de parsing n'a réussi). Merci de vérifier votre email ou de saisir manuellement dans l'app BoB."
          // );
          // log('✅ Retour de sendUserNotificationEmail (échec : parsing)');
        }

        processedCount++;
        log(`✅ Email ${processedCount}/${results.length} traité avec succès`);
      } catch (emailError) {
        errorCount++;
        log('❌ Erreur lors du traitement de l\'email :');
        log(emailError.message || emailError.toString());
        if (emailError.stack) log(emailError.stack);
        continue; // Continue avec le prochain email même en cas d'erreur
      }
    }

    await connection.end();
    log(`✅ Script terminé. ${processedCount} emails traités, ${errorCount} erreurs.`);
    
    // Arrêt explicite du script
    if (errorCount > 0) {
      log("⚠️ Script terminé avec des erreurs");
      process.exit(1);
    } else {
      log("✅ Script terminé avec succès");
      process.exit(0);
    }
  } catch (error) {
    log('❌ Erreur fatale dans checkEmails :');
    if (error) {
      log(error.message || error.toString());
      if (error.stack) log(error.stack);
    }
    process.exit(1);
  }
}

function extractTripInfo(text) {
  try {
    log("🔍 Texte à parser :", text);

    // Insérer un retour à la ligne APRÈS chaque champ
    text = text.replace(/(Départ|Start Date)\s*:\s*([^\n\r]*)/i, '$1 : $2\n')
               .replace(/(Retour|End Date)\s*:\s*([^\n\r]*)/i, '$1 : $2\n')
               .replace(/(Destination)\s*:\s*([^\n\r]*)/i, '$1 : $2\n');
    log("📝 Texte après nettoyage :", text);

    // Extraire chaque champ ligne par ligne
    const departMatch = text.match(/(Départ|Start Date)\s*:\s*(.+)/i);
    const retourMatch = text.match(/(Retour|End Date)\s*:\s*(.+)/i);
    const destinationMatch = text.match(/(Destination)\s*:\s*(.+)/i);

    log("🔍 Résultats des matches :", {
      depart: departMatch?.[2],
      retour: retourMatch?.[2],
      destination: destinationMatch?.[2]
    });

    if (!departMatch || !retourMatch || !destinationMatch) {
      log("❌ Un ou plusieurs champs manquants");
      return null;
    }

    const departRaw = departMatch[2].trim();
    const retourRaw = retourMatch[2].trim();
    const destination = destinationMatch[2].trim();

    // Convertir les dates en français vers un format ISO
    const mois = {
      'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
      'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
      'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
    };

    const formatDate = (dateStr) => {
      // Si la date est au format DD/MM/YYYY
      if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Si la date est au format "jour mois année" en français
      const [jour, moisFr, annee] = dateStr.trim().split(' ');
      const moisNum = mois[moisFr?.toLowerCase()];
      if (!moisNum) {
        log("❌ Format de date non reconnu :", dateStr);
        return null;
      }
      return `${annee}-${moisNum}-${jour.padStart(2, '0')}`;
    };

    const departStr = formatDate(departRaw);
    const retourStr = formatDate(retourRaw);
    log("📅 Dates formatées :", { departStr, retourStr });
    
    if (!departStr || !retourStr) {
      log("❌ Erreur de formatage des dates");
      return null;
    }

    const depart = new Date(departStr);
    const retour = new Date(retourStr);
    log("📅 Dates parsées :", { depart, retour });
    
    if (isNaN(depart.getTime()) || isNaN(retour.getTime())) {
      log("❌ Dates invalides après parsing");
      return null;
    }

    return { depart, retour, destination };
  } catch (error) {
    log("❌ Erreur dans extractTripInfo :", error);
    return null;
  }
}

async function extractTripInfoAI(emailText) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `Voici un email contenant des informations de voyage. Extrait la date de départ, la date de retour et la destination, même si le format n'est pas strict. Réponds uniquement en JSON, exemple :\n{\n  "depart": "2025-06-21",\n  "retour": "2025-06-28",\n  "destination": "Rome"\n}\n\nEmail :\n${emailText}`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 200,
    });
    const text = response.choices[0].message.content;
    log('🧠 Réponse brute IA:', text);
    return JSON.parse(text);
  } catch (e) {
    log("Erreur OpenAI ou parsing JSON IA :", e);
    return null;
  }
}

// Extraction avancée de vols depuis un email (ex: EasyJet)
function extractFlightsFromEmail(text) {
  // On va chercher tous les blocs "VILLE_A à VILLE_B" puis extraire les infos de vol
  const flightBlocks = [];
  const flightRegex = /(\w[\w\s\-'.]+?) à ([\w\s\-'.]+?)\n([A-Z0-9]{5,}\s*flight)?[\s\S]*?Départ\s*:\s*([\w.\s\d:]+)\nArrivée\s*:\s*([\w.\s\d:]+)/gmi;
  let match;
  while ((match = flightRegex.exec(text)) !== null) {
    flightBlocks.push({
      from: match[1].trim(),
      to: match[2].trim(),
      flightNumber: match[3]?.replace(/flight/i, '').trim() || '',
      departRaw: match[4].trim(),
      arriveeRaw: match[5].trim(),
    });
  }

  // Chercher la référence de réservation (ex: K9D16T1)
  const refMatch = text.match(/référence de réservation[:\s]+([A-Z0-9]{6,})/i);
  const bookingRef = refMatch ? refMatch[1] : '';

  // Chercher le passager principal
  const passengerMatch = text.match(/Bonjour,\s*([A-ZÉÈÀÙÂÊÎÔÛÇ\s'-]+)/i);
  const passenger = passengerMatch ? passengerMatch[1].replace(/[,;].*$/, '').trim() : '';

  // Chercher la compagnie aérienne (ex: easyJet)
  const airlineMatch = text.match(/easyJet|Air France|KLM|Lufthansa|Swiss|Ryanair|Transavia|Vueling|British Airways|Iberia|Turkish Airlines|Emirates|Qatar Airways|Air Canada|United|Delta|American Airlines/i);
  const airline = airlineMatch ? airlineMatch[0] : '';

  // Fonction pour parser une date française (jeu. 05 juin 2025 14:10)
  const mois = {
    'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
    'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
    'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
  };
  function parseFrDate(str) {
    // Ex: "jeu. 05 juin 2025 14:10"
    const m = str.match(/(\d{1,2})\s+([a-zéûîôàè]+)\s+(\d{4})\s+(\d{2}:\d{2})/i);
    if (m) {
      const [_, day, month, year, time] = m;
      const moisNum = mois[month.toLowerCase()];
      if (moisNum) {
        return `${year}-${moisNum}-${day.padStart(2, '0')}T${time}:00`;
      }
    }
    // Fallback: format ISO ou autre
    return str;
  }

  // Construction du résultat
  return flightBlocks.map(fb => ({
    bookingRef,
    airline,
    flightNumber: fb.flightNumber,
    passenger,
    from: fb.from,
    to: fb.to,
    departure: parseFrDate(fb.departRaw),
    arrival: parseFrDate(fb.arriveeRaw),
    // Champs optionnels à compléter plus tard (sièges, terminaux, etc.)
  }));
}

// --- PARSING AVANCÉ TRIPIT-LIKE ---
function parseTripItStyleFromEmail(text) {
  // --- Extraction des segments de vol ---
  const air_segments = [];
  // On cherche tous les blocs "VILLE à VILLE" avec numéro de vol, dates, sièges, bagages...
  const flightRegex = /([A-ZÉÈÀÙÂÊÎÔÛÇa-zéèàùâêîôûç\-'.\s]+?) à ([A-ZÉÈÀÙÂÊÎÔÛÇa-zéèàùâêîôûç\-'.\s]+?)\s*\n\s*([A-Z0-9]{2,6})?\s*([A-Z0-9]{3,})?\s*([\s\S]*?)(?=\n\s*[A-ZÉÈÀÙÂÊÎÔÛÇa-zéèàùâêîôûç\-'.\s]+? à |$)/gmi;
  let match;
  while ((match = flightRegex.exec(text)) !== null) {
    const [block, from, to, airlineCode, flightNumber, details] = match;
    // Dates et heures
    const depMatch = details.match(/Départ\s*:?\s*([\w.\s\d:]+)/i);
    const arrMatch = details.match(/Arrivée\s*:?\s*([\w.\s\d:]+)/i);
    // Siège
    const seatMatch = details.match(/Si[èe]ge\s*:?\s*([A-Z0-9]+)/i);
    // Bagages
    const bagSmall = details.match(/Petit bagage.*?(\d+)\s*x.*?(\d+\s*x\s*\d+\s*x\s*\d+)/i);
    const bagLarge = details.match(/Grand bagage.*?(\d+)\s*x.*?(\d+\s*x\s*\d+\s*x\s*\d+)/i);
    // Terminal/porte
    const terminalDep = details.match(/Terminal départ\s*:?\s*([A-Z0-9]+)/i);
    const terminalArr = details.match(/Terminal arrivée\s*:?\s*([A-Z0-9]+)/i);
    // Classe
    const classMatch = details.match(/Classe\s*:?\s*([\w]+)/i);
    // Statut
    const statusMatch = details.match(/Statut\s*:?\s*([\w]+)/i);
    // Codes IATA (si présents)
    const iataDep = details.match(/([A-Z]{3})\s*\(départ\)/i);
    const iataArr = details.match(/([A-Z]{3})\s*\(arrivée\)/i);
    // Dates formatées
    const mois = {
      'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
      'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
      'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
    };
    function parseFrDate(str) {
      const m = str.match(/(\d{1,2})\s+([a-zéûîôàè]+)\s+(\d{4})\s+(\d{2}:\d{2})/i);
      if (m) {
        const [_, day, month, year, time] = m;
        const moisNum = mois[month.toLowerCase()];
        if (moisNum) {
          return `${year}-${moisNum}-${day.padStart(2, '0')}T${time}:00`;
        }
      }
      return str;
    }
    air_segments.push({
      airline: airlineCode || '',
      flight_number: flightNumber || '',
      confirmation_number: record_locator || '',
      departure_airport_code: iataDep ? iataDep[1] : '',
      departure_airport_name: from.trim(),
      departure_city: from.trim(),
      departure_time: depMatch ? parseFrDate(depMatch[1].trim()) : '',
      departure_timezone: '',
      terminal_departure: terminalDep ? terminalDep[1] : '',
      gate_departure: '',
      arrival_airport_code: iataArr ? iataArr[1] : '',
      arrival_airport_name: to.trim(),
      arrival_city: to.trim(),
      arrival_time: arrMatch ? parseFrDate(arrMatch[1].trim()) : '',
      arrival_timezone: '',
      terminal_arrival: terminalArr ? terminalArr[1] : '',
      gate_arrival: '',
      seat: seatMatch ? seatMatch[1] : '',
      class_of_service: classMatch ? classMatch[1] : '',
      aircraft: '',
      fare_category: '',
      meal: '',
      entertainment: '',
      stopovers: '',
      distance: '',
      on_time_percentage: '',
      baggage: {
        cabin_small: bagSmall ? { qty: parseInt(bagSmall[1]), max_size: bagSmall[2] } : null,
        cabin_large: bagLarge ? { qty: parseInt(bagLarge[1]), max_size: bagLarge[2] } : null,
        hold: null
      },
      status: statusMatch ? statusMatch[1] : 'confirmed',
    });
  }

  // --- Extraction location de voiture ---
  let car_rental = null;
  const carMatch = text.match(/Location de voiture[\s\S]*?Num[ée]ro de r[ée]servation\s*([A-Z0-9]+)[\s\S]*?(\w[\w\s-]+)[\s\S]*?R[ée]cup[ée]rer[\s\S]*?(\d{1,2} \w+ \d{4} \d{2}:\d{2})[\s\S]*?Rendre[\s\S]*?(\d{1,2} \w+ \d{4} \d{2}:\d{2})/i);
  if (carMatch) {
    car_rental = {
      company: 'THRIFTY', // à améliorer si d'autres loueurs
      reference: carMatch[1],
      model: carMatch[2].trim(),
      pickup_location: 'Bruxelles - Aéroport Zaventem', // à extraire si possible
      pickup_time: carMatch[3],
      dropoff_location: 'Bruxelles - Aéroport Zaventem',
      dropoff_time: carMatch[4],
    };
  }

  // --- Extraction paiements ---
  const payments = [];
  const paymentRegex = /Paiement à ([\w ]+) de ([\d,.]+) ([A-Z]{3}) par ([\w ]+) le (\d{2}\/\d{2}\/\d{4}|\d{2}\/\d{2}\/\d{2}|\d{2}\/\d{2}\/\d{2,4})/gi;
  let payMatch;
  while ((payMatch = paymentRegex.exec(text)) !== null) {
    payments.push({
      to: payMatch[1].trim(),
      amount: parseFloat(payMatch[2].replace(',', '.')),
      currency: payMatch[3],
      method: payMatch[4].trim(),
      date: payMatch[5],
    });
  }

  // --- Extraction passagers ---
  const passengers = [];
  const passMatch = text.match(/M\s+([A-ZÉÈÀÙÂÊÎÔÛÇ\s'-]+)/i);
  if (passMatch) {
    passengers.push({ name: passMatch[1].trim() });
  }

  // --- Extraction référence de réservation ---
  const refMatch = text.match(/référence de réservation[:\s]+([A-Z0-9]{6,})/i);
  const record_locator = refMatch ? refMatch[1] : '';

  // --- Extraction liens de gestion ---
  const links = [];
  const manageMatch = text.match(/https:\/\/www\.easyjet\.com\/fr\/secure\/MyEasyJet\.mvc\/ViewBooking\?bookingReference=([A-Z0-9]+)/i);
  if (manageMatch) {
    links.push({ type: 'manageBooking', url: manageMatch[0] });
  }

  // --- Construction de l'objet principal ---
  return {
    trip_id: record_locator,
    type: 'air',
    record_locator,
    air_segments,
    passengers,
    car_rental,
    payments,
    links,
    raw_email: text,
    parsed_at: new Date().toISOString(),
  };
}

// --- PARSING EASYJET FRANÇAIS ---
function parseEasyJetEmail(rawText) {
  log('🛫 Début parsing EasyJet');
  const lines = rawText.split('\n');
  const trips = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Détecter un nouveau vol
    if (line.includes('à') && line.includes('|')) {
      const cities = line.split('à').map(c => c.trim().replace('|', '').trim());
      if (cities.length === 2) {
        if (current) trips.push(current);
        current = {
          flight_number: '',
          departure_city: cities[0],
          arrival_city: cities[1],
          departure_time: '',
          arrival_time: '',
          seat: '',
          baggage: {},
          status: 'confirmed'
        };
        log('✈️ Vol trouvé :', cities[0], '->', cities[1]);
      }
    }

    // Chercher le numéro de vol
    if (current && line.match(/[A-Z]{2,3}\d{3,4}/)) {
      current.flight_number = line.match(/[A-Z]{2,3}\d{3,4}/)[0];
    }

    // Chercher les dates/heures
    if (current) {
      if (line.includes('Départ') || line.includes('départ')) {
        log('🕒 Ligne départ trouvée :', line);
        const nextLine = lines[i + 1]?.trim();
        if (nextLine) {
          log('🕒 Ligne suivante :', nextLine);
          current.departure_time = parseFrenchDate(nextLine);
        }
      }
      if (line.includes('Arrivée') || line.includes('arrivée')) {
        log('🕒 Ligne arrivée trouvée :', line);
        const nextLine = lines[i + 1]?.trim();
        if (nextLine) {
          log('🕒 Ligne suivante :', nextLine);
          current.arrival_time = parseFrenchDate(nextLine);
        }
      }
    }

    // Détecter une location de voiture
    if (line.includes('Location de voiture')) {
      const carInfo = {
        flight_number: '',
        departure_city: '',
        arrival_city: '',
        departure_time: '',
        arrival_time: '',
        seat: '',
        baggage: {},
        status: 'confirmed',
        type: 'car_rental'
      };

      // Chercher le numéro de réservation
      const bookingMatch = rawText.match(/Numéro de réservation\s+([A-Z0-9]+)/);
      if (bookingMatch) {
        carInfo.flight_number = bookingMatch[1];
      }

      // Chercher les dates de location
      for (let j = i; j < Math.min(i + 20, lines.length); j++) {
        if (lines[j].includes('Récupérer')) {
          const pickupLine = lines[j + 2]?.trim();
          if (pickupLine) {
            carInfo.departure_time = parseFrenchDate(pickupLine);
          }
        }
        if (lines[j].includes('Rendre')) {
          const returnLine = lines[j + 2]?.trim();
          if (returnLine) {
            carInfo.arrival_time = parseFrenchDate(returnLine);
          }
        }
      }

      if (carInfo.departure_time && carInfo.arrival_time) {
        trips.push(carInfo);
      }
    }
  }

  if (current) trips.push(current);
  
  if (trips.length > 0) {
    log('✅ Résultat parsing EasyJet :', JSON.stringify(trips, null, 2));
    return { air_segments: trips };
  }
  
  return null;
}

function parseFrenchDate(line) {
  log('🔍 Parsing date :', line);
  
  // Dictionnaire des mois en français et en anglais
  const months = {
    // Français
    'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04', 'mai': '05', 'juin': '06',
    'juillet': '07', 'août': '08', 'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12',
    // English
    'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06',
    'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12',
    // Abréviations françaises
    'janv': '01', 'févr': '02', 'avr': '04', 'juil': '07', 'sept': '09', 'oct': '10', 'nov': '11', 'déc': '12',
    // Abréviations anglaises
    'jan': '01', 'feb': '02', 'apr': '04', 'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };

  // Pattern pour gérer les formats français et anglais
  // Ex FR: "jeu. 05 juin 2025 14:10" ou "05 juin 2025 14:10"
  // Ex EN: "Thu. 05 June 2025 14:10" ou "05 June 2025 14:10"
  const dateMatch = line.match(/(?:[a-zéûîôàè]+\.\s*)?(\d{1,2})\s+([a-zéûîôàè]+)\.?\s+(\d{4})\s+(\d{2}:\d{2})/i);
  
  if (!dateMatch) {
    log('❌ Format de date non reconnu :', line);
    log('❌ Pattern utilisé :', /(?:[a-zéûîôàè]+\.\s*)?(\d{1,2})\s+([a-zéûîôàè]+)\.?\s+(\d{4})\s+(\d{2}:\d{2})/i);
    
    // Essayer le format DD/MM/YYYY HH:mm
    const altMatch = line.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}:\d{2})/);
    if (altMatch) {
      log('✅ Format alternatif trouvé (DD/MM/YYYY HH:mm)');
      const [_, day, month, year, time] = altMatch;
      const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}:00`;
      log('✅ Date parsée :', result);
      return result;
    }
    
    return '';
  }
  
  log('✅ Match trouvé :', dateMatch);
  const [_, day, monthStr, year, time] = dateMatch;
  log('✅ Composants extraits :', { day, monthStr, year, time });
  
  const month = months[monthStr.toLowerCase().replace(/\.$/, '')];
  if (!month) {
    log('❌ Mois non reconnu :', monthStr);
    log('❌ Mois disponibles :', Object.keys(months).join(', '));
    return '';
  }
  
  const result = `${year}-${month}-${day.padStart(2, '0')}T${time}:00`;
  log('✅ Date parsée :', result);
  return result;
}

// Fonction d'enrichissement FlightRadar24 améliorée
async function enrichFlightSegmentWithFR24(segment) {
  try {
    if (segment.aircraft && segment.departure_airport_code && segment.arrival_airport_code && 
        segment.departure_timezone && segment.arrival_timezone) {
      log('✅ Segment déjà enrichi : ' + segment.flight_number);
      return segment;
    }

    const cacheKey = `${segment.flight_number}-${segment.departure_time}`;
    const cachedData = fr24Cache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      log('📦 Utilisation du cache pour : ' + segment.flight_number);
      return { ...segment, ...cachedData.data };
    }

    let flightNumber = (segment.flight_number || '').replace(/\s+/g, '').toUpperCase();
    if (!flightNumber) {
      log('⚠️ Pas de numéro de vol à enrichir');
      return segment;
    }

    // Vérifier si le numéro de vol est valide
    if (!/^[A-Z0-9]{2,6}$/.test(flightNumber)) {
      log('⚠️ Numéro de vol invalide : ' + flightNumber);
      return segment;
    }

    log('🔎 Appel FR24 avec flight_number: ' + flightNumber);
    try {
      const flight = await fetchFlight(flightNumber);
      
      if (!flight) {
        log('⚠️ Aucun résultat FR24 pour : ' + flightNumber);
        return segment;
      }

      const enrichedData = {
        aircraft: flight.model || segment.aircraft || '',
        departure_airport_code: flight.origin?.id || segment.departure_airport_code || '',
        arrival_airport_code: flight.destination?.id || segment.arrival_airport_code || '',
        departure_timezone: flight.origin?.timezone || segment.departure_timezone || '',
        arrival_timezone: flight.destination?.timezone || segment.arrival_timezone || '',
      };

      fr24Cache.set(cacheKey, {
        data: enrichedData,
        timestamp: Date.now()
      });

      log('✅ Enrichissement réussi pour : ' + flightNumber);
      return { ...segment, ...enrichedData };
    } catch (fr24Error) {
      log('❌ Erreur FR24 pour ' + flightNumber + ' : ' + (fr24Error.message || fr24Error.toString()));
      if (fr24Error.stack) log('❌ Stack FR24 : ' + fr24Error.stack);
      return segment; // Retourner le segment original en cas d'erreur
    }
  } catch (error) {
    log('❌ Erreur générale pour ' + segment.flight_number + ' : ' + (error.message || error.toString()));
    if (error.stack) log('❌ Stack générale : ' + error.stack);
    return segment; // Retourner le segment original en cas d'erreur
  }
}

checkEmails();
