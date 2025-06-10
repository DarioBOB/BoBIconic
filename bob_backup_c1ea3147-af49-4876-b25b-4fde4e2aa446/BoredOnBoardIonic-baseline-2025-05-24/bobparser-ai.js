require('dotenv').config();
var OpenAI = require('openai');
var admin = require('firebase-admin');
var Imap = require('imap');
var { simpleParser } = require('mailparser');
var winston = require('winston');
var { enrichFlightWithFR24 } = require('./fr24-utils');
var serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
var db = admin.firestore();

var openai = new OpenAI.OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith('sk-')) {
  logger.error('OPENAI_API_KEY is missing or invalid. Please check your .env file.');
  process.exit(1);
}

var imapConfig = {
  user: process.env['ZOHO_EMAIL'],
  password: process.env['ZOHO_PASSWORD'],
  host: 'imappro.zoho.eu',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

var logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
if (process.env['NODE_ENV'] !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

var openAIPrompt = (emailText) => `You are a travel assistant specialized in extracting travel plans from emails. Your task is to analyze the following email content and extract all travel-related information in a structured JSON format.

IMPORTANT RULES:
1. Return ONLY valid JSON, no other text
2. If multiple plans are found, return an array of plans
3. If no plans are found, return an empty array []
4. For each plan, include ALL possible fields, even if empty
5. Use null for missing values, not undefined or empty strings
6. Ensure all dates are in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
7. Include source information in each plan

PLAN SCHEMA:
{
  "type": string, // One of: "flight", "hotel", "car_rental", "activity", "train", "ferry", "restaurant", "meeting"
  "title": string, // A descriptive title for the plan
  "startDate": string, // ISO 8601 date
  "endDate": string, // ISO 8601 date
  "location": {
    "name": string,
    "address": string,
    "city": string,
    "country": string,
    "coordinates": {
      "latitude": number,
      "longitude": number
    }
  },
  "details": {
    // Type-specific details
    "flight": {
      "flight_number": string,
      "airline": string,
      "departure": {
        "airport": string,
        "terminal": string,
        "gate": string
      },
      "arrival": {
        "airport": string,
        "terminal": string,
        "gate": string
      },
      "class": string,
      "seat": string,
      "booking_reference": string
    },
    "hotel": {
      "name": string,
      "room_type": string,
      "check_in_time": string,
      "check_out_time": string,
      "booking_reference": string,
      "confirmation_number": string
    },
    "car_rental": {
      "company": string,
      "car_type": string,
      "pickup_location": string,
      "dropoff_location": string,
      "booking_reference": string
    },
    "activity": {
      "name": string,
      "description": string,
      "duration": string,
      "booking_reference": string
    },
    "train": {
      "train_number": string,
      "operator": string,
      "departure": {
        "station": string,
        "platform": string
      },
      "arrival": {
        "station": string,
        "platform": string
      },
      "class": string,
      "seat": string,
      "booking_reference": string
    },
    "ferry": {
      "ferry_number": string,
      "operator": string,
      "departure": {
        "port": string,
        "terminal": string
      },
      "arrival": {
        "port": string,
        "terminal": string
      },
      "booking_reference": string
    },
    "restaurant": {
      "name": string,
      "cuisine": string,
      "reservation_time": string,
      "party_size": number,
      "reservation_number": string
    },
    "meeting": {
      "title": string,
      "description": string,
      "attendees": string[],
      "location": string,
      "meeting_link": string
    }
  },
  "source": {
    "type": string,
    "provider": string,
    "reference": string
  },
  "createdAt": string // ISO 8601 date
}

Email content:
${emailText}

Remember: Return ONLY valid JSON, no other text.`;

var openAIPromptFR = (emailText) => `Vous êtes un assistant de voyage spécialisé dans l'extraction d'informations sur les voyages à partir d'emails. Votre tâche est d'analyser le contenu suivant de l'email et d'extraire toutes les informations sur le voyage en format JSON structuré.

IMPORTANT : TOUS les champs textuels (titre, type, etc.) doivent être rédigés en FRANÇAIS, même si l'email est en anglais.

IMPORTANT RULES:
1. Retournez SEULEMENT du JSON valide, aucun autre texte
2. Si plusieurs plans sont trouvés, retournez un tableau de plans
3. Si aucun plan n'est trouvé, retournez un tableau vide []
4. Pour chaque plan, incluez TOUS les champs possibles, même s'ils sont vides
5. Utilisez null pour les valeurs manquantes, pas undefined ou des chaînes vides
6. Assurez-vous que toutes les dates sont en format ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
7. Incluez des informations sur la source dans chaque plan

PLAN SCHEMA:
{
  "type": string, // One of: "flight", "hotel", "car_rental", "activity", "train", "ferry", "restaurant", "meeting"
  "title": string, // A descriptive title for the plan
  "startDate": string, // ISO 8601 date
  "endDate": string, // ISO 8601 date
  "location": {
    "name": string,
    "address": string,
    "city": string,
    "country": string,
    "coordinates": {
      "latitude": number,
      "longitude": number
    }
  },
  "details": {
    // Type-specific details
    "flight": {
      "flight_number": string,
      "airline": string,
      "departure": {
        "airport": string,
        "terminal": string,
        "gate": string
      },
      "arrival": {
        "airport": string,
        "terminal": string,
        "gate": string
      },
      "class": string,
      "seat": string,
      "booking_reference": string
    },
    "hotel": {
      "name": string,
      "room_type": string,
      "check_in_time": string,
      "check_out_time": string,
      "booking_reference": string,
      "confirmation_number": string
    },
    "car_rental": {
      "company": string,
      "car_type": string,
      "pickup_location": string,
      "dropoff_location": string,
      "booking_reference": string
    },
    "activity": {
      "name": string,
      "description": string,
      "duration": string,
      "booking_reference": string
    },
    "train": {
      "train_number": string,
      "operator": string,
      "departure": {
        "station": string,
        "platform": string
      },
      "arrival": {
        "station": string,
        "platform": string
      },
      "class": string,
      "seat": string,
      "booking_reference": string
    },
    "ferry": {
      "ferry_number": string,
      "operator": string,
      "departure": {
        "port": string,
        "terminal": string
      },
      "arrival": {
        "port": string,
        "terminal": string
      },
      "booking_reference": string
    },
    "restaurant": {
      "name": string,
      "cuisine": string,
      "reservation_time": string,
      "party_size": number,
      "reservation_number": string
    },
    "meeting": {
      "title": string,
      "description": string,
      "attendees": string[],
      "location": string,
      "meeting_link": string
    }
  },
  "source": {
    "type": string,
    "provider": string,
    "reference": string
  },
  "createdAt": string // ISO 8601 date
}

Email content:
${emailText}

Remember: Retournez SEULEMENT du JSON valide, aucun autre texte.`;

async function parseEmailWithAI(emailText, meta) {
  try {
    logger.info('Starting email parsing with AI', { 
      provider: meta.provider, 
      reference: meta.reference,
      emailLength: emailText.length 
    });

    if (!emailText || emailText.trim().length === 0) {
      logger.error('Empty email text provided');
      return [];
    }

    // Réduire la taille du texte de l'email si nécessaire
    const maxEmailLength = 4000;
    let processedEmailText = emailText;
    if (emailText.length > maxEmailLength) {
      logger.warn('Email text too long, truncating', { 
        originalLength: emailText.length,
        truncatedLength: maxEmailLength
      });
      processedEmailText = emailText.substring(0, maxEmailLength) + '...';
    }

    var prompt = meta.lang === 'fr' ? openAIPromptFR(processedEmailText) : openAIPrompt(processedEmailText);
    logger.info('Generated OpenAI prompt', { 
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 200) + '...'
    });

    var response;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000;

    while (retryCount < maxRetries) {
      try {
        logger.info('Calling OpenAI API...', { attempt: retryCount + 1 });
        response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 2000
        });
        
        if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
          logger.error('Invalid OpenAI response structure', { response });
          return [];
        }

        logger.info('Received OpenAI response', {
          hasContent: !!response.choices[0].message.content,
          contentLength: response.choices[0].message.content?.length
        });
        break;

      } catch (apiError) {
        retryCount++;
        
        if (apiError.code === 'rate_limit_exceeded' && retryCount < maxRetries) {
          logger.warn('Rate limit exceeded, retrying...', {
            attempt: retryCount,
            maxRetries,
            delay: retryDelay
          });
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
          continue;
        }

        logger.error('OpenAI API call failed', { 
          error: apiError.message,
          code: apiError.code,
          type: apiError.type,
          status: apiError.status,
          attempt: retryCount
        });
        return [];
      }
    }

    if (retryCount === maxRetries) {
      logger.error('Max retries reached for OpenAI API call');
      return [];
    }

    const rawContent = response.choices[0].message.content;
    logger.info('OpenAI raw response', { 
      rawContentLength: rawContent.length,
      rawContentPreview: rawContent.substring(0, 200) + '...'
    });

    let plans = [];
    try {
      plans = JSON.parse(rawContent);
      logger.info('Successfully parsed plans from JSON', { 
        plansCount: Array.isArray(plans) ? plans.length : 1,
        isArray: Array.isArray(plans)
      });
    } catch (err) {
      logger.error('JSON parsing error', { 
        error: err.message,
        rawContentPreview: rawContent.substring(0, 200) + '...'
      });
      return [];
    }

    if (!Array.isArray(plans)) {
      logger.info('Converting single plan to array');
      plans = [plans];
    }

    logger.info('Processing plans', { count: plans.length });
    
    if (plans.length === 0) {
      logger.warn('No plans extracted from email', { 
        provider: meta.provider, 
        reference: meta.reference 
      });
      return [];
    }

    // UP-SERT TRIP
    let trip = null;
    try {
      // 1. Lors de la création du trip, calculer la plage de dates sur tous les plans
      const sortedPlans = [...plans].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      const tripStartDate = new Date(sortedPlans[0].startDate);
      const tripEndDate = new Date(sortedPlans[sortedPlans.length - 1].endDate);
      
      const existingTrips = await db.collection('trips')
        .where('userId', '==', meta.userId)
        .where('startDate', '==', admin.firestore.Timestamp.fromDate(tripStartDate))
        .where('endDate', '==', admin.firestore.Timestamp.fromDate(tripEndDate))
        .get();
      let upsertTripId = null;
      if (!existingTrips.empty) {
        // Si un trip existe, on le met à jour
        const doc = existingTrips.docs[0];
        upsertTripId = doc.id;
        await db.collection('trips').doc(upsertTripId).update({
          title: plans[0].title,
          updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
          status: 'active',
          metadata: {
            source: meta.provider
          }
        });
        trip = { id: upsertTripId, ...doc.data(), title: plans[0].title };
        logger.info('Trip existant mis à jour', { tripId: upsertTripId });
      } else {
        // Sinon, on crée
        trip = {
          userId: meta.userId,
          title: plans[0].title,
          startDate: admin.firestore.Timestamp.fromDate(tripStartDate),
          endDate: admin.firestore.Timestamp.fromDate(tripEndDate),
          createdAt: admin.firestore.Timestamp.fromDate(new Date()),
          updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
          status: 'active',
          plans: [],
          metadata: {
            source: meta.provider
          }
        };
        const tripRef = await db.collection('trips').add(trip);
        trip.id = tripRef.id;
        logger.info('Nouveau trip créé', { tripId: trip.id });
      }
    } catch (error) {
      logger.error('Erreur upsert trip', { error: error.message });
      return [];
    }

    // UP-SERT PLANS
    var writePromises = [];
    for (var plan of plans) {
      if (!plan || typeof plan !== 'object') {
        logger.error('Invalid plan object', { plan });
        continue;
      }
      // 1. Correction du type et de la structure des détails pour les vols
      // Si le plan contient un numéro de vol mais pas de type explicite, on force type='flight' et structure
      if (
        (!plan.type || plan.type === 'unknown') &&
        (
          (plan.details && (plan.details.flight_number || (plan.details.flight && plan.details.flight.flight_number))) ||
          (plan.flight_number)
        )
      ) {
        plan.type = 'flight';
        // Normalisation de la structure details.flight
        if (!plan.details) plan.details = {};
        if (!plan.details.flight) {
          plan.details.flight = {};
        }
        // Copie les propriétés de haut niveau dans details.flight si besoin
        if (plan.details.flight_number) {
          plan.details.flight.flight_number = plan.details.flight_number;
          delete plan.details.flight_number;
        }
        if (plan.flight_number) {
          plan.details.flight.flight_number = plan.flight_number;
          delete plan.flight_number;
        }
        // Copie airline, departure, arrival, etc. si présents au mauvais niveau
        ['airline', 'departure', 'arrival', 'class', 'seat', 'booking_reference'].forEach(key => {
          if (plan.details[key]) {
            plan.details.flight[key] = plan.details[key];
            delete plan.details[key];
          }
        });
      }
      // Log si le type reste inconnu ou si details est vide
      if (plan.type === 'unknown' || !plan.details || Object.keys(plan.details).length === 0) {
        logger.warn('Plan type unknown ou details vide', { plan });
      }
      // 2. Title
      if (!plan.title || typeof plan.title !== 'string' || plan.title.trim() === '') {
        if (plan.type === 'flight' && plan.details && plan.details.flight && plan.details.flight.departure && plan.details.flight.arrival) {
          plan.title = `Vol de ${plan.details.flight.departure.airport || '?'} à ${plan.details.flight.arrival.airport || '?'}`;
        } else if (plan.type === 'hotel' && plan.details && plan.details.hotel && plan.details.hotel.name) {
          plan.title = `Hôtel : ${plan.details.hotel.name}`;
        } else if (plan.type === 'car_rental' && plan.details && plan.details.car_rental && plan.details.car_rental.company) {
          plan.title = `Location voiture : ${plan.details.car_rental.company}`;
        } else if (plan.type === 'activity' && plan.details && plan.details.activity && plan.details.activity.name) {
          plan.title = `Activité : ${plan.details.activity.name}`;
        } else {
          plan.title = '-';
          logger.warn('Plan title is missing and could not be inferred', { plan });
        }
      }
      // 3. Dates
      if (!plan.startDate || isNaN(new Date(plan.startDate))) {
        logger.warn('Plan startDate is missing or invalid', { plan });
        plan.startDate = new Date().toISOString();
      }
      if (!plan.endDate || isNaN(new Date(plan.endDate))) {
        logger.warn('Plan endDate is missing or invalid', { plan });
        plan.endDate = plan.startDate;
      }
      // 4. Détails
      if (!plan.details || typeof plan.details !== 'object') {
        plan.details = {};
        logger.warn('Plan details missing, set to empty object', { plan });
      }
      // Correction Firestore: forcer tous les champs source à être non undefined
      if (!plan.source) plan.source = {};
      plan.source = {
        type: typeof meta.type !== 'undefined' ? meta.type : (typeof plan.source.type !== 'undefined' ? plan.source.type : null),
        provider: typeof meta.provider !== 'undefined' ? meta.provider : (typeof plan.source.provider !== 'undefined' ? plan.source.provider : null),
        reference: typeof meta.reference !== 'undefined' ? meta.reference : (typeof plan.source.reference !== 'undefined' ? plan.source.reference : null)
      };
      // Enrichir les données de vol avec FlightRadar24
      if (plan.type === 'flight' && plan.details?.flight?.flight_number) {
        try {
          logger.info('Enriching flight with FR24 data', { flightNumber: plan.details.flight.flight_number });
          const fr24Data = await enrichFlightWithFR24(plan.details.flight);
          plan.details.flight.fr24_enrichment = fr24Data;
          if (fr24Data) {
            plan.details.flight.aircraft = {
              type: fr24Data.aircraft?.type || null,
              registration: fr24Data.aircraft?.registration || null,
              age: fr24Data.aircraft?.age || null
            };
            plan.details.flight.route = {
              distance: fr24Data.route?.distance || null,
              duration: fr24Data.route?.duration || null,
              waypoints: fr24Data.route?.waypoints || []
            };
            plan.details.flight.weather = fr24Data.weather || null;
            plan.details.flight.airports = {
              departure: {
                code: fr24Data.airports?.departure?.code || null,
                name: fr24Data.airports?.departure?.name || null,
                city: fr24Data.airports?.departure?.city || null,
                country: fr24Data.airports?.departure?.country || null,
                coordinates: fr24Data.airports?.departure?.coordinates || null
              },
              arrival: {
                code: fr24Data.airports?.arrival?.code || null,
                name: fr24Data.airports?.arrival?.name || null,
                city: fr24Data.airports?.arrival?.city || null,
                country: fr24Data.airports?.arrival?.country || null,
                coordinates: fr24Data.airports?.arrival?.coordinates || null
              }
            };
          }
        } catch (err) {
          logger.error('FR24 enrichment error', { error: err.message, flightNumber: plan.details.flight.flight_number });
        }
      }
      // Ajouter des métadonnées communes
      const planMetadata = {
        source: meta.provider,
        parsedAt: new Date()
      };
      if (typeof meta.reference !== 'undefined' && meta.reference !== null) {
        planMetadata.emailReference = meta.reference;
      }
      plan.createdAt = new Date();
      plan.updatedAt = new Date();
      plan.tripId = trip.id;
      plan.status = 'active';
      plan.metadata = planMetadata;
      // Log du plan juste avant insertion/mise à jour Firestore
      logger.info('PLAN FINAL AVANT UPSERT', { plan });
      // UP-SERT PLAN
      let planQuery = db.collection('plans')
        .where('tripId', '==', trip.id)
        .where('type', '==', plan.type)
        .where('startDate', '==', plan.startDate)
        .where('endDate', '==', plan.endDate);
      // Ajout d'un identifiant métier si dispo (numéro de vol, réservation, etc.)
      if (plan.type === 'flight' && plan.details?.flight?.flight_number) {
        planQuery = planQuery.where('details.flight.flight_number', '==', plan.details.flight.flight_number);
      } else if (plan.type === 'hotel' && plan.details?.hotel?.booking_reference) {
        planQuery = planQuery.where('details.hotel.booking_reference', '==', plan.details.hotel.booking_reference);
      }
      const existingPlans = await planQuery.get();
      if (!existingPlans.empty) {
        // Update le plan existant
        const doc = existingPlans.docs[0];
        await db.collection('plans').doc(doc.id).update({
          ...plan,
          updatedAt: new Date()
        });
        logger.info('Plan existant mis à jour', { planId: doc.id, type: plan.type, title: plan.title });
      } else {
        // Crée le plan
        const p = db.collection('plans').add(plan)
          .then((docRef) => {
            logger.info('Nouveau plan créé', { type: plan.type, title: plan.title, id: docRef.id });
            // Met à jour le trip avec le nouvel ID de plan
            return db.collection('trips').doc(trip.id).update({
              plans: admin.firestore.FieldValue.arrayUnion(docRef.id),
              updatedAt: new Date()
            });
          })
          .catch((firestoreError) => {
            logger.error('Erreur création plan Firestore', { error: firestoreError.message, code: firestoreError.code, plan: JSON.stringify(plan).substring(0, 200) + '...' });
          });
        writePromises.push(p);
      }
      // 2. Lors de l'ajout de chaque plan, après l'upsert, vérifier si le plan étend la période du trip
      const planStart = new Date(plan.startDate);
      const planEnd = new Date(plan.endDate);
      const tripRef = db.collection('trips').doc(trip.id);
      const tripSnap = await tripRef.get();
      if (tripSnap.exists) {
        const tripData = tripSnap.data();
        let updateNeeded = false;
        let newStart = tripData.startDate.toDate();
        let newEnd = tripData.endDate.toDate();
        if (planStart < newStart) {
          newStart = planStart;
          updateNeeded = true;
        }
        if (planEnd > newEnd) {
          newEnd = planEnd;
          updateNeeded = true;
        }
        if (updateNeeded) {
          await tripRef.update({
            startDate: admin.firestore.Timestamp.fromDate(newStart),
            endDate: admin.firestore.Timestamp.fromDate(newEnd),
            updatedAt: new Date()
          });
          logger.info('Trip étendu suite à ajout/maj plan', { tripId: trip.id, newStart, newEnd });
        }
      }
    }
    await Promise.all(writePromises);
    logger.info('All plans processed successfully', { count: plans.length });
    return plans;
  } catch (error) {
    logger.error('Unexpected error in parseEmailWithAI', { 
      error: error.message,
      stack: error.stack
    });
    return [];
  }
}

// Décodage quoted-printable (simple)
function decodeQuotedPrintable(str) {
  return str.replace(/=([A-Fa-f0-9]{2})/g, (m, code) => String.fromCharCode(parseInt(code, 16))).replace(/=\r?\n/g, '');
}

async function parseEmails() {
  logger.info('Starting email parsing process');
  
  if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_PASSWORD) {
    logger.error('Missing Zoho credentials in environment variables');
    throw new Error('Missing Zoho credentials');
  }

  var imap = new Imap(imapConfig);
  
  return new Promise((resolve, reject) => {
    const processMessage = async (msg) => {
      return new Promise((resolveMsg, rejectMsg) => {
        logger.info('Processing new email message');
        
        msg.on('body', async (stream) => {
          logger.info('Received email body stream');
          try {
            let buffer = '';
            stream.on('data', (chunk) => {
              buffer += chunk.toString('utf8');
            });
            stream.on('end', async () => {
              logger.info('Email body stream ended', { bufferLength: buffer.length });
              try {
                // Extraction manuelle du texte brut du mail
                let rawText = buffer;
                let bodyStart = buffer.indexOf('\r\n\r\n');
                if (bodyStart !== -1) {
                  rawText = buffer.slice(bodyStart + 4);
                }
                logger.info('Extracted raw email text', {
                  length: rawText.length,
                  preview: rawText.substring(0, 200) + '...'
                });
                // Décodage quoted-printable
                let decodedText = decodeQuotedPrintable(rawText);
                logger.info('Decoded email text', {
                  length: decodedText.length,
                  preview: decodedText.substring(0, 200) + '...'
                });
                // EXTRACTION DE L'EMAIL EXPEDITEUR
                let fromEmail = null;
                try {
                  const parsed = await simpleParser(buffer);
                  if (parsed.from && parsed.from.value && parsed.from.value.length > 0) {
                    fromEmail = parsed.from.value[0].address;
                  }
                } catch (e) {
                  logger.error('Erreur extraction email expéditeur', { error: e.message });
                }
                if (!fromEmail) {
                  logger.error('Impossible d\'extraire l\'email expéditeur, mail ignoré');
                  return resolveMsg();
                }
                // MAPPING EMAIL -> USERID FIRESTORE
                let userId = null;
                let userLang = 'en';
                try {
                  const userSnap = await db.collection('users').where('email', '==', fromEmail).get();
                  if (!userSnap.empty) {
                    userId = userSnap.docs[0].id;
                    const userData = userSnap.docs[0].data();
                    if (userData.preferredLang) userLang = userData.preferredLang;
                  }
                } catch (e) {
                  logger.error('Erreur recherche userId Firestore', { error: e.message, email: fromEmail });
                }
                if (!userId) {
                  logger.error('Aucun utilisateur Firestore trouvé pour cet email, mail ignoré', { email: fromEmail });
                  return resolveMsg();
                }
                // Lancer le parsing IA avec le bon userId et la bonne langue
                const plans = await parseEmailWithAI(decodedText, {
                  type: 'email',
                  provider: 'zoho',
                  reference: msg.uid,
                  userId: userId,
                  fromEmail: fromEmail,
                  lang: userLang
                });
                // Marquer le mail comme lu
                try {
                  msg.imapConnection.addFlags(msg.uid, '\\Seen', (err) => {
                    if (err) {
                      logger.error('Erreur lors du passage du mail en lu', { uid: msg.uid, error: err.message });
                    } else {
                      logger.info('Mail marqué comme lu', { uid: msg.uid });
                    }
                  });
                } catch (e) {
                  logger.error('Erreur imapConnection.addFlags', { error: e.message });
                }
                logger.info('Email processing completed', {
                  plansCount: plans.length,
                  messageUid: msg.uid
                });
                resolveMsg();
              } catch (error) {
                logger.error('Error processing email body', {
                  error: error.message,
                  stack: error.stack
                });
                rejectMsg(error);
              }
            });
            stream.on('error', (error) => {
              logger.error('Error reading email stream', {
                error: error.message,
                stack: error.stack
              });
              rejectMsg(error);
            });
          } catch (error) {
            logger.error('Error setting up email stream processing', {
              error: error.message,
              stack: error.stack
            });
            rejectMsg(error);
          }
        });

        msg.on('error', (error) => {
          logger.error('Error processing message', {
            error: error.message,
            stack: error.stack
          });
          rejectMsg(error);
        });
      });
    };

    imap.once('ready', () => {
      logger.info('IMAP connection ready');
      
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          logger.error('Error opening INBOX', {
            error: err.message,
            stack: err.stack
          });
          return reject(err);
        }

        logger.info('INBOX opened successfully', { 
          totalMessages: box.messages.total,
          newMessages: box.messages.new
        });

        imap.search(['UNSEEN'], async (err, results) => {
          if (err) {
            logger.error('Error searching for unread messages', {
              error: err.message,
              stack: err.stack
            });
            return reject(err);
          }

          logger.info('Found unread messages', { count: results.length });

          if (results.length === 0) {
            logger.info('No unread messages found');
            imap.end();
            return resolve([]);
          }

          try {
            const f = imap.fetch(results, { bodies: '' });
            const messagePromises = [];

            f.on('message', (msg) => {
              messagePromises.push(processMessage(msg));
            });

            f.once('error', (err) => {
              logger.error('Error fetching messages', {
                error: err.message,
                stack: err.stack
              });
              reject(err);
            });

            f.once('end', async () => {
              try {
                await Promise.all(messagePromises);
                logger.info('All messages processed successfully');
                imap.end();
                resolve();
              } catch (error) {
                logger.error('Error processing messages', {
                  error: error.message,
                  stack: error.stack
                });
                reject(error);
              }
            });
          } catch (error) {
            logger.error('Error setting up message processing', {
              error: error.message,
              stack: error.stack
            });
            reject(error);
          }
        });
      });
    });

    imap.once('error', (err) => {
      logger.error('IMAP connection error', {
        error: err.message,
        stack: err.stack
      });
      reject(err);
    });

    imap.once('end', () => {
      logger.info('IMAP connection ended');
    });

    logger.info('Connecting to IMAP server...');
    imap.connect();
  });
}

if (require.main === module) {
  parseEmails()
    .then(() => { logger.info('Email parsing completed'); process.exit(0); })
    .catch((error) => { logger.error('Email parsing failed', error); process.exit(1); });
} 