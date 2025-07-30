// Script Node.js pour uniformiser la structure des trips Firestore
// Usage : node scripts/migrate-trips-uniform.js

const admin = require('firebase-admin');
const path = require('path');

try {
  const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (error) {
  console.error('ERREUR: Le fichier serviceAccountKey.json est introuvable.');
  process.exit(1);
}
const db = admin.firestore();

function toTimestamp(val) {
  if (!val) return null;
  if (typeof val === 'object' && val._seconds !== undefined) return val;
  if (typeof val === 'string') {
    const d = new Date(val);
    return { _seconds: Math.floor(d.getTime()/1000), _nanoseconds: 0 };
  }
  return null;
}

function toTitleObj(val) {
  if (!val) return { fr: '', en: '' };
  if (typeof val === 'object' && (val.fr || val.en)) return { fr: val.fr || '', en: val.en || '' };
  return { fr: val, en: val };
}

async function migrateTrips() {
  const tripsSnapshot = await db.collection('trips').get();
  for (const doc of tripsSnapshot.docs) {
    const trip = doc.data();
    const id = doc.id;
    let changed = false;
    const updated = {
      id: id,
      userId: trip.userId || '',
      startDate: toTimestamp(trip.startDate),
      endDate: toTimestamp(trip.endDate),
      origin: trip.origin || {},
      destination: trip.destination || {},
      summary: trip.summary || '',
      title: toTitleObj(trip.title),
      currency: trip.currency || '',
      totalBudget: trip.totalBudget !== undefined ? trip.totalBudget : 0,
      createdAt: toTimestamp(trip.createdAt),
      updatedAt: toTimestamp(trip.updatedAt),
      plans: Array.isArray(trip.plans) ? trip.plans : [],
      createdByDemo: trip.createdByDemo || false,
      createdByTemplate: trip.createdByTemplate || false,
      callsign: trip.callsign || null,
      status: trip.status || null,
      metadata: trip.metadata || {}
    };
    // Log et update si différent
    if (JSON.stringify(trip) !== JSON.stringify(updated)) {
      await doc.ref.set(updated, { merge: false });
      console.log(`[MIGRATION] Trip ${id} mis à jour :`, updated);
      changed = true;
    }
    if (!changed) {
      console.log(`[MIGRATION] Trip ${id} déjà conforme.`);
    }
  }
  console.log('--- MIGRATION TRIPS TERMINÉE ---');
}

migrateTrips().catch(err => {
  console.error('Erreur migration trips:', err);
  process.exit(1);
}); 