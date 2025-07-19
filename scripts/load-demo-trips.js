/**
 * Script unifié de chargement des voyages démo (TripIt-like) avec le SDK Admin
 *
 * - Supprime tous les trips/plans de démo existants
 * - Crée les 3 voyages démo (Montréal, Athènes, Marrakech)
 * - Associe tout à l'utilisateur démo
 *
 * Usage : node scripts/load-demo-trips.js
 * Nécessite : npm install firebase-admin
 * et un fichier serviceAccountKey.json à la racine (clé privée admin Firebase)
 */

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

// Récupérer l'ID du user démo
const DEMO_USER_ID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';

const MS_IN_DAY = 1000 * 60 * 60 * 24;

// Fonctions utilitaires
function parseDate(str) {
  return new Date(str);
}

function shiftDate(origDateStr, origTripStartStr, newTripStart) {
  const origDate = parseDate(origDateStr);
  const origBase = parseDate(origTripStartStr);
  const delta = origDate.getTime() - origBase.getTime();
  return new Date(newTripStart.getTime() + delta);
}

async function deleteExistingDemoData() {
  console.log('--- Nettoyage des anciennes données démo ---');
  const collections = ['plans', 'trips'];
  for (const col of collections) {
    const snapshot = await db.collection(col)
      .where('userId', '==', DEMO_USER_ID)
      .where('createdByDemo', '==', true)
      .get();

    if (snapshot.empty) {
      console.log(`- Aucune donnée à nettoyer dans "${col}".`);
      continue;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`- ${snapshot.size} documents supprimés de "${col}".`);
  }
}

async function seedTrips() {
  console.log('\n--- Création des nouveaux voyages démo ---');
  const now = new Date();

  const templates = [
    {
      key: 'past',
      title: 'Semaine à Marrakech',
      originalTrip: { start: '2024-04-15T00:00:00', end: '2024-04-22T23:59:59' },
      plans: [
        { title: 'Vol Aller GVA-RAK', type: 'flight', original: { start: '2024-04-15T09:10:00', end: '2024-04-15T11:30:00' }, details: { airline: 'EasyJet', flightNumber: 'U2 1234' } },
        { title: 'Hôtel Riad Kniza', type: 'hotel', original: { start: '2024-04-15T14:00:00', end: '2024-04-22T12:00:00' }, details: { address: '34 Derb l\'Hotel, Marrakesh' } },
        { title: 'Dîner Place Jemaa el-Fna', type: 'activity', original: { start: '2024-04-15T19:30:00', end: '2024-04-15T22:00:00' }, details: {} },
        { title: 'Excursion Atlas et 3 Vallées', type: 'activity', original: { start: '2024-04-18T08:00:00', end: '2024-04-18T18:00:00' }, details: {} },
        { title: 'Vol Retour RAK-GVA', type: 'flight', original: { start: '2024-04-22T12:25:00', end: '2024-04-22T16:55:00' }, details: { airline: 'EasyJet', flightNumber: 'U2 1235' } },
      ]
    },
    {
      key: 'present',
      title: "Découverte d'Athènes",
      originalTrip: { start: '2024-07-05T00:00:00', end: '2024-07-15T23:59:59' },
      plans: [
        { title: 'Vol Aller GVA-ATH', type: 'flight', original: { start: '2024-07-05T07:15:00', end: '2024-07-05T10:50:00' }, details: { airline: 'Swiss', flightNumber: 'LX 1830' } },
        { title: 'Hôtel Plaka', type: 'hotel', original: { start: '2024-07-05T14:00:00', end: '2024-07-10T12:00:00' }, details: { address: '7 Kapnikareas, Athina' } },
        { title: 'Visite de l\'Acropole', type: 'activity', original: { start: '2024-07-06T09:00:00', end: '2024-07-06T13:00:00' }, details: {} },
        { title: 'Ferry pour Santorin', type: 'boat', original: { start: '2024-07-10T07:00:00', end: '2024-07-10T12:00:00' }, details: { company: 'Blue Star Ferries' } },
        { title: 'Hôtel Oia', type: 'hotel', original: { start: '2024-07-10T14:00:00', end: '2024-07-15T12:00:00' }, details: { address: 'Oia, Santorini' } },
        { title: 'Vol Retour ATH-GVA', type: 'flight', original: { start: '2024-07-15T18:00:00', end: '2024-07-15T19:45:00' }, details: { airline: 'Swiss', flightNumber: 'LX 1831' } },
      ]
    },
    {
      key: 'future',
      title: 'Road trip Québec',
      originalTrip: { start: '2025-09-10T00:00:00', end: '2025-09-25T23:59:59' },
      plans: [
        { title: 'Vol Aller GVA-YUL', type: 'flight', original: { start: '2025-09-10T10:40:00', end: '2025-09-10T13:00:00' }, details: { airline: 'Air Canada', flightNumber: 'AC 835' } },
        { title: 'Location voiture Montréal', type: 'car_rental', original: { start: '2025-09-10T14:00:00', end: '2025-09-23T18:00:00' }, details: { provider: 'Hertz' } },
        { title: 'Hôtel Montréal', type: 'hotel', original: { start: '2025-09-10T16:00:00', end: '2025-09-13T11:00:00' }, details: {} },
        { title: 'Parc National de la Mauricie', type: 'activity', original: { start: '2025-09-14T09:00:00', end: '2025-09-15T17:00:00' }, details: {} },
        { title: 'Hôtel Québec', type: 'hotel', original: { start: '2025-09-16T15:00:00', end: '2025-09-20T11:00:00' }, details: {} },
        { title: 'Observation des baleines', type: 'activity', original: { start: '2025-09-18T08:00:00', end: '2025-09-18T13:00:00' }, details: {} },
        { title: 'Vol Retour YUL-GVA', type: 'flight', original: { start: '2025-09-24T21:00:00', end: '2025-09-25T10:30:00' }, details: { airline: 'Air Canada', flightNumber: 'AC 834' } },
      ]
    }
  ];

  const newStarts = {
    past: new Date(now.getTime() - 210 * MS_IN_DAY),
    present: new Date(now.getTime() - 10 * MS_IN_DAY),
    future: new Date(now.getTime() + 400 * MS_IN_DAY)
  };

  for (const tpl of templates) {
    const origStart = parseDate(tpl.originalTrip.start);
    const origEnd   = parseDate(tpl.originalTrip.end);
    const durationMs = origEnd.getTime() - origStart.getTime();
    const newStart = newStarts[tpl.key];
    const newEnd   = new Date(newStart.getTime() + durationMs);

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
    console.log(`- Voyage "${tpl.title}" créé.`);

    const batch = db.batch();
    for (const p of tpl.plans) {
      const planRef = db.collection('plans').doc();
      const newPlanStart = shiftDate(p.original.start, tpl.originalTrip.start, newStart);
      const newPlanEnd   = shiftDate(p.original.end, tpl.originalTrip.start, newStart);
      batch.set(planRef, {
        id: planRef.id, tripId: tripRef.id, userId: DEMO_USER_ID, title: p.title, type: p.type,
        startDate: admin.firestore.Timestamp.fromDate(newPlanStart),
        endDate:   admin.firestore.Timestamp.fromDate(newPlanEnd),
        details: p.details, createdByDemo: true
      });
    }
    await batch.commit();
    console.log(`  - ${tpl.plans.length} plans associés créés.`);
  }
}

(async () => {
  try {
    await deleteExistingDemoData();
    await seedTrips();
    console.log('\n✅ Script terminé. La base de données est prête.');
  } catch (err) {
    console.error('❌ ERREUR DURANT LE SCRIPT:', err);
  }
})();