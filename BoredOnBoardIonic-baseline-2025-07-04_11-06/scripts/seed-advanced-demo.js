// seed-demo-trips-fixed.js
// Ce script supprime les voyages et plans existants du user démo (createdByDemo=true)
// puis crée trois voyages (passé lointain, présent <1 mois, futur lointain) et leurs plans

const admin = require('firebase-admin');
const path = require('path');

// --- Initialisation ---
try {
  const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (error) {
  console.error("ERREUR: Le fichier serviceAccountKey.json est introuvable.");
  process.exit(1);
}
const db = admin.firestore();

// Récupérer l'ID du user démo (identique à load-demo-trips.js)
const DEMO_USER_ID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';

const MS_IN_DAY = 1000 * 60 * 60 * 24;

// Fonctions utilitaires
function parseDate(str) {
  // str format ISO-compatible (YYYY-MM-DD or YYYY-MM-DDTHH:mm)
  return new Date(str);
}

function shiftDate(origDateStr, origTripStartStr, newTripStart) {
  const origDate = parseDate(origDateStr);
  const origBase = parseDate(origTripStartStr);
  const delta = origDate.getTime() - origBase.getTime();
  return new Date(newTripStart.getTime() + delta);
}

async function deleteExistingDemoData() {
  const collections = ['plans', 'trips'];
  for (const col of collections) {
    const snapshot = await db.collection(col)
      .where('userId', '==', DEMO_USER_ID)
      .where('createdByDemo', '==', true)
      .get();

    if (snapshot.empty) continue;

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`${snapshot.size} docs deleted from ${col}`);
  }
}

async function seedTrips() {
  const now = new Date();

  // Définition des trois voyages de démo (d'après les .txt)
  const templates = [
    {
      key: 'past',
      title: 'Semaine à Marrakech',
      originalTrip: { start: '2024-04-15T00:00:00', end: '2024-04-22T00:00:00' },
      // plans d'après "Voyage Passé Démo Marrakech.txt"
      plans: [
        {
          title: 'Vol Aller – Genève → Marrakech',
          type: 'flight',
          original: { start: '2024-04-15T09:00:00', end: '2024-04-15T11:30:00' },
          details: { airline: 'RAM', flightNumber: 'AT 941' }
        },
        {
          title: 'Transfert privé Aéroport → Hôtel',
          type: 'car',
          original: { start: '2024-04-15T12:15:00', end: '2024-04-15T13:00:00' },
          details: { provider: 'Atlas Experience', driver: 'Rachid' }
        },
      ]
    },
    {
      key: 'present',
      title: "Découverte d'Athènes",
      originalTrip: { start: '2024-07-05T00:00:00', end: '2024-07-15T00:00:00' },
      // plans d'après "Voyage En cours Démo Athene.txt"
      plans: [
        {
          title: 'Vol Aller – Genève → Athènes',
          type: 'flight',
          original: { start: '2024-07-05T07:15:00', end: '2024-07-05T10:45:00' },
          details: { airline: 'Aegean', flightNumber: 'A3 847' }
        },
        {
          title: 'Location voiture – Athènes',
          type: 'car_rental',
          original: { start: '2024-07-05T11:30:00', end: '2024-07-08T10:00:00' },
          details: { provider: 'Europcar' }
        },
      ]
    },
    {
      key: 'future',
      title: 'Road trip Québec',
      originalTrip: { start: '2025-09-10T00:00:00', end: '2025-09-25T00:00:00' },
      // plans d'après "Voyage Futur Démo Montreal.txt"
      plans: [
        {
          title: 'Vol Aller – Genève → Montréal',
          type: 'flight',
          original: { start: '2025-09-10T10:40:00', end: '2025-09-10T13:00:00' },
          details: { airline: 'EasyJet', flightNumber: 'U2 5129' }
        },
        {
          title: 'Location voiture – Montréal',
          type: 'car_rental',
          original: { start: '2025-09-10T14:00:00', end: '2025-09-23T10:00:00' },
          details: { provider: 'Enterprise' }
        },
      ]
    }
  ];

  // Calcul de nouveaux créneaux
  const newStarts = {
    past: new Date(now.getTime() - 210 * MS_IN_DAY),      // ~7 mois en arrière
    present: new Date(now.getTime() - 10 * MS_IN_DAY),     // 10 jours en arrière
    future: new Date(now.getTime() + 400 * MS_IN_DAY)      // ~13 mois en avant
  };

  for (const tpl of templates) {
    const origStart = parseDate(tpl.originalTrip.start);
    const origEnd   = parseDate(tpl.originalTrip.end);
    const durationMs = origEnd.getTime() - origStart.getTime();

    const newStart = newStarts[tpl.key];
    const newEnd   = new Date(newStart.getTime() + durationMs);

    // Création du trip
    const tripRef = db.collection('trips').doc();
    await tripRef.set({
      id: tripRef.id,
      userId: DEMO_USER_ID,
      startDate: admin.firestore.Timestamp.fromDate(newStart),
      endDate: admin.firestore.Timestamp.fromDate(newEnd),
      createdByDemo: true,
      type: tpl.key === 'future' ? 'road_trip' : 'vacation',
      title: tpl.title,
      createdAt: admin.firestore.Timestamp.now()
    });
    console.log(`Trip ${tpl.key} created: ${tripRef.id}`);

    // Création des plans
    const batch = db.batch();
    for (const p of tpl.plans) {
      const planRef = db.collection('plans').doc();
      const newPlanStart = shiftDate(p.original.start, tpl.originalTrip.start, newStart);
      const newPlanEnd   = shiftDate(p.original.end, tpl.originalTrip.start, newStart);

      batch.set(planRef, {
        id: planRef.id,
        tripId: tripRef.id,
        userId: DEMO_USER_ID,
        title: p.title,
        type: p.type,
        startDate: admin.firestore.Timestamp.fromDate(newPlanStart),
        endDate:   admin.firestore.Timestamp.fromDate(newPlanEnd),
        details: p.details,
        createdByDemo: true
      });
    }
    await batch.commit();
    console.log(`${tpl.plans.length} plans seeded for trip ${tpl.key}`);
  }
}

(async () => {
  try {
    console.log('Deleting existing demo data...');
    await deleteExistingDemoData();
    console.log('Seeding new demo trips...');
    await seedTrips();
    console.log('✅ Seeding terminé avec succès');
  } catch (err) {
    console.error('Erreur durant le seeding:', err);
  }
})(); 