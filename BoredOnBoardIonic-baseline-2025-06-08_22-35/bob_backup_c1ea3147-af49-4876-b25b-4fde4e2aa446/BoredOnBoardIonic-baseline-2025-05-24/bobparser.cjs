console.log('=== SCRIPT IMAP-TEST-SIMPLE.CJS LANCÉ ===');
console.log('=== DEBUT SCRIPT ===');
require('dotenv/config');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const OpenAI = require('openai');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Initialisation Firebase Admin
const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Configuration email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_SECURE === 'true', // true pour 465, false pour 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const config = {
  imap: {
    user: process.env.ZOHO_EMAIL,
    password: process.env.ZOHO_PASSWORD,
    host: process.env.EMAIL_HOST,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 30000,
    connTimeout: 30000,
    debug: console.log
  }
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Fonction utilitaire pour parser les dates (ISO ou français)
function parseDate(dateStr) {
  if (!dateStr) return null;
  // Si déjà au format ISO, new Date fonctionne
  const d = new Date(dateStr);
  if (!isNaN(d)) return d;
  // Sinon, tente de parser le format français (ex: "jeu. 05 juin 2025 14:10")
  const match = dateStr.match(/(\d{2}) (\w+) (\d{4}) (\d{2}):(\d{2})/);
  if (match) {
    const [ , day, monthFr, year, hour, min ] = match;
    const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    const month = months.indexOf(monthFr.toLowerCase());
    if (month !== -1) {
      return new Date(Date.UTC(year, month, day, hour, min));
    }
  }
  return null;
}

const prompt = `Lis l'email de confirmation de voyage ci-dessous (je vais le copier-coller après ce message) et réalise les actions suivantes :

1. Extraction structurée
   - Identifie l'utilisateur principal (email, nom si disponible).
   - Déduis le ou les voyages (trips) : destination(s), compagnies, numéros de réservation, participants.
   - Pour chaque voyage, liste tous les plans (segments) : vols, hôtels, locations de voiture, activités, etc.
   - Pour chaque plan, structure les informations clés (ex : pour un vol : numéro, compagnie, aéroports, horaires, terminal, porte, statut, type d'avion, etc.).

2. Règle métier sur les dates de voyage
   - Important : La date de début d'un voyage doit être la date de début du premier plan (le plus tôt), et la date de fin celle du dernier plan (le plus tard).
   - Si tu ajoutes, modifies ou supprimes un plan, ajuste automatiquement les bornes du voyage en conséquence.

3. Enrichissement automatique
   - Pour chaque vol, enrichis les données en recherchant sur le web (FlightRadar24, sites d'aéroports, Wikipedia, etc.) : statut du vol, terminaux, portes, distances, durée estimée, type d'avion, retards moyens, immatriculations typiques, politique bagages, etc.
   - Pour chaque hôtel ou location, enrichis avec : adresse, téléphone, horaires, politique d'annulation, services, etc.
   - Pour chaque activité, ajoute des infos contextuelles (lieu, horaires, site web, etc.).
   - Ajoute des POIs (points d'intérêt) pertinents à proximité des aéroports ou destinations (musées, restaurants, transports, etc.) si possible.

4. Structuration JSON
   - Formate la réponse STRICTEMENT en JSON natif, SANS commentaire, SANS markdown, SANS texte avant ou après, et compatible Firestore (pas de types spéciaux, pas de Date, pas d'undefined, pas de NaN, pas de fonctions, pas de commentaires, pas de types personnalisés, pas de valeurs nulles inutiles).
   - Utilise uniquement des types simples : string, number, boolean, array, object. Toutes les dates doivent être au format ISO 8601 (exemple : 2025-06-05T14:10:00Z).
   - N'inclus rien d'autre que le JSON.

5. Contraintes
   - Recherche et enrichis les données via des sources fiables : FlightRadar24, sites d'aéroports, Wikipedia, Google, etc.
   - Si une information n'est pas trouvable, laisse le champ vide ou null.
   - Réponds UNIQUEMENT avec le JSON, sans aucun texte avant ou après.

Voici le texte de l'email :\n\n`;

// Fonction pour envoyer un email
async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: process.env.ZOHO_EMAIL,
      to,
      subject,
      text
    });
    console.log(`✅ Email envoyé à ${to}`);
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
  }
}

// Fonction pour vérifier si un utilisateur existe
async function userExists(email) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return !!userRecord;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return false;
    }
    throw error;
  }
}

// Fonction pour créer ou mettre à jour le user dans Firestore
async function createOrUpdateUser(userRecord, userData) {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userRecord.uid);
  await userRef.set({
    email: userRecord.email,
    name: userData && userData.name ? userData.name : '',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

// Fonction utilitaire pour générer un ID stable pour un trip
function getTripId(userId, tripData) {
  // Utilise reservationNumber si dispo, sinon destination+dates
  const base = tripData.reservationNumber || (tripData.destination + (tripData.startDate || '') + (tripData.endDate || ''));
  return crypto.createHash('sha1').update(userId + '_' + base).digest('hex');
}

// Fonction utilitaire pour générer un ID stable pour un plan
function getPlanId(tripId, plan, idx) {
  // Utilise type + numéro de vol/réservation + date de départ
  const base = plan.type + '_' + (plan.flightNumber || plan.reservationNumber || plan.departureTime || plan.pickupTime || idx);
  return crypto.createHash('sha1').update(tripId + '_' + base).digest('hex');
}

// Fonction pour créer/mettre à jour un voyage et ses plans (idempotence)
async function createOrUpdateTrip(userId, tripData) {
  const db = admin.firestore();
  const batch = db.batch();

  try {
    // Log structure pour debug
    console.log('Structure tripData reçue :', JSON.stringify(tripData, null, 2));
    // Générer un ID stable pour le trip
    const tripId = getTripId(userId, tripData);
    const tripRef = db.collection('trips').doc(tripId);
    // Créer ou mettre à jour le voyage
    batch.set(tripRef, {
      userId,
      title: tripData.title || tripData.destination || tripData.reservationNumber || 'Voyage sans titre',
      startDate: parseDate(tripData.startDate),
      endDate: parseDate(tripData.endDate),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
      metadata: {
        source: 'email',
        lastEmailParsed: new Date().toISOString()
      }
    }, { merge: true });

    // Créer ou mettre à jour les plans
    const planRefs = [];
    const plansArray = tripData.plans || tripData.segments || [];
    for (let i = 0; i < plansArray.length; i++) {
      const plan = plansArray[i];
      // Correction : harmoniser le champ type en snake_case
      let planType = plan.type;
      if (planType) {
        planType = planType.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
      } else {
        planType = 'unknown';
      }
      // Correction : garantir un champ title non vide
      let planTitle = plan.title;
      if (!planTitle || planTitle === '-') {
        // Générer un titre par défaut selon le type
        switch (planType) {
          case 'flight':
            planTitle = plan.flightNumber || plan.reservationNumber || plan.departureTime || 'Vol';
            break;
          case 'hotel':
            planTitle = plan.hotelName || plan.reservationNumber || plan.checkIn || 'Hôtel';
            break;
          case 'car_rental':
            planTitle = plan.company || plan.reservationNumber || plan.pickupTime || 'Location voiture';
            break;
          case 'activity':
            planTitle = plan.activityName || plan.reservationNumber || plan.startTime || 'Activité';
            break;
          default:
            planTitle = plan.reservationNumber || planType || 'Plan';
        }
      }
      const planId = getPlanId(tripId, plan, i);
      const planRef = db.collection('plans').doc(planId);
      planRefs.push(planRef);
      batch.set(planRef, {
        ...plan,
        type: planType,
        title: planTitle,
        tripId: tripId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        metadata: {
          source: 'email',
          emailReference: new Date().toISOString(),
          parsedAt: new Date().toISOString()
        }
      }, { merge: true });
    }

    // Mettre à jour le voyage avec les références des plans
    batch.set(tripRef, {
      plans: planRefs.map(ref => ref.id)
    }, { merge: true });

    // Exécuter le batch
    await batch.commit();
    console.log('✅ Voyage et plans créés/mis à jour avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur création/mise à jour voyage:', error);
    console.error('tripData problématique :', JSON.stringify(tripData, null, 2));
    return false;
  }
}

(async () => {
  try {
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = { bodies: [''], markSeen: false };
    const results = await connection.search(searchCriteria, fetchOptions);
    console.log('Nombre d\'emails non lus trouvés :', results.length);
    
    if (results.length === 0) {
      console.log('Aucun email non lu.');
      await connection.end();
      console.log('--- FIN SCRIPT ---');
      return;
    }

    for (const mail of results) {
      const part = mail.parts.find(p => p.which === '');
      if (!part || !part.body) {
        console.log('Email sans corps, ignoré.');
        continue;
      }

      const parsed = await simpleParser(part.body);
      const text = parsed.text || '';
      // Extraction propre de l'adresse email
      let senderEmail = '';
      if (parsed.from && parsed.from.value && parsed.from.value.length > 0) {
        senderEmail = parsed.from.value[0].address;
      } else if (parsed.from && parsed.from.text) {
        // Fallback: extraire l'email du champ text si besoin
        const match = parsed.from.text.match(/([\w.-]+@[\w.-]+)/);
        senderEmail = match ? match[1] : parsed.from.text;
      }
      
      console.log('Expéditeur :', senderEmail);
      console.log('Sujet :', parsed.subject);
      console.log('Corps (début) :', text.slice(0, 500));

      // Ignorer les emails du user de démo
      if (senderEmail === 'guestuser@demo.com') {
        console.log('Email du user de démo ignoré');
        await connection.addFlags(mail.attributes.uid, '\\Seen');
        continue;
      }

      // Appel OpenAI
      console.log('--- AVANT APPEL OPENAI ---');
      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'user', content: prompt + text }
          ],
          temperature: 0.2,
          max_tokens: 2000
        });
      } catch (err) {
        console.error('❌ Erreur lors de l\'appel OpenAI :', err);
        await sendEmail(senderEmail, 
          'Erreur de traitement de votre email',
          'Nous n\'avons pas pu traiter votre email de voyage. Veuillez réessayer plus tard.'
        );
        continue;
      }

      let response = completion?.choices?.[0]?.message?.content;
      if (!response) {
        console.error('❌ Réponse OpenAI vide ou non définie.');
        await sendEmail(senderEmail,
          'Erreur de traitement de votre email',
          'Nous n\'avons pas pu extraire les informations de votre email. Veuillez vérifier le format et réessayer.'
        );
        continue;
      }

      // Extraction du JSON
      let jsonStart = response.indexOf('{');
      let jsonEnd = response.lastIndexOf('}');
      let jsonString = response.slice(jsonStart, jsonEnd + 1);
      let data;
      try {
        data = JSON.parse(jsonString);
        // Compatibilité : accepter 'trip' (objet) ou 'trips' (tableau)
        if (!data.trips && data.trip) {
          data.trips = [data.trip];
        }
        console.log('✅ Résultat structuré OpenAI :\n', JSON.stringify(data, null, 2));
      } catch (e) {
        console.error('Erreur de parsing JSON OpenAI :', e);
        await sendEmail(senderEmail,
          'Erreur de traitement de votre email',
          'Nous n\'avons pas pu structurer les informations de votre email. Veuillez vérifier le format et réessayer.'
        );
        continue;
      }

      // Vérifier si l'utilisateur existe
      const exists = await userExists(senderEmail);
      if (!exists) {
        console.log('Utilisateur non trouvé :', senderEmail);
        await sendEmail(senderEmail,
          'Bienvenue sur BoB !',
          'Nous avons reçu votre email de voyage, mais vous n\'êtes pas encore inscrit sur BoB. Veuillez créer un compte pour profiter de nos services.'
        );
        continue;
      }

      // Vérifier si les données sont valides
      if (!data || !data.trips || data.trips.length === 0) {
        console.log('Aucun voyage trouvé dans les données');
        await sendEmail(senderEmail,
          'Email reçu mais pas de voyage détecté',
          'Nous avons bien reçu votre email, mais nous n\'avons pas pu y détecter d\'informations de voyage. Veuillez vérifier le format et réessayer.'
        );
        continue;
      }

      // Créer/mettre à jour le user dans Firestore
      const userRecord = await admin.auth().getUserByEmail(senderEmail);
      await createOrUpdateUser(userRecord, data.user);
      // Créer/mettre à jour les voyages
      let success = true;
      for (const trip of data.trips) {
        const tripSuccess = await createOrUpdateTrip(userRecord.uid, trip);
        if (!tripSuccess) {
          success = false;
          break;
        }
      }

      if (success) {
        await sendEmail(senderEmail,
          'Voyage ajouté à BoB !',
          'Votre voyage a été ajouté avec succès à votre compte BoB. Vous pouvez maintenant le consulter dans l\'application.'
        );
      } else {
        await sendEmail(senderEmail,
          'Erreur lors de l\'ajout de votre voyage',
          'Une erreur est survenue lors de l\'ajout de votre voyage. Veuillez réessayer plus tard.'
        );
      }

      // Marquer l'email comme lu
      await connection.addFlags(mail.attributes.uid, '\\Seen');
    }

    await connection.end();
    console.log('--- FIN SCRIPT ---');
  } catch (e) {
    console.error('Erreur :', e);
    console.log('--- FIN SCRIPT ---');
  }
})(); 