// Script pour importer les données du fichier Firebase Export.txt
const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = require('./serviceAccountKey.json');

const DEMO_UID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Lire le fichier JSON propre
function parseFirebaseExport() {
  const content = fs.readFileSync('athens-demo-clean.json', 'utf8');
  const data = JSON.parse(content);
  return data;
}

async function clearDemoData() {
  console.log('--- PURGE DES DONNÉES DÉMO ---');
  const collections = ['plans', 'trips'];
  for (const coll of collections) {
    const snap = await db.collection(coll)
      .where('userId', '==', DEMO_UID)
      .get();
    for (const doc of snap.docs) {
      await doc.ref.delete();
      console.log(`[RESET] ${coll} supprimé : ${doc.id}`);
    }
  }
}

async function importData() {
  console.log('--- IMPORT DES DONNÉES ---');
  
  const { users, trips, plans } = parseFirebaseExport();
  
  // Importer les plans d'abord
  for (const plan of plans) {
    const planRef = db.collection('plans').doc(plan.id);
    await planRef.set({
      ...plan,
      userId: DEMO_UID,
      createdByDemo: true
    });
    console.log(`[IMPORT] Plan créé : ${plan.id} (${plan.type})`);
  }
  
  // Importer les voyages
  for (const trip of trips) {
    const tripRef = db.collection('trips').doc(trip.id);
    await tripRef.set({
      ...trip,
      userId: DEMO_UID,
      createdByDemo: true
    });
    console.log(`[IMPORT] Voyage créé : ${trip.id}`);
  }
  
  console.log('--- IMPORT TERMINÉ ---');
}

(async () => {
  try {
    await clearDemoData();
    await importData();
    console.log('✅ Import réussi !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    process.exit(1);
  }
})(); 