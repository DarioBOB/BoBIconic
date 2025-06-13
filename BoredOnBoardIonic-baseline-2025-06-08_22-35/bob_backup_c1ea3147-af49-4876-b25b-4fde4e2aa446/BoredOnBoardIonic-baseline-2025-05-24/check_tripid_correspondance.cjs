// Script pour vérifier la correspondance exacte entre tripId des plans et id des voyages
require('dotenv/config');
const admin = require('firebase-admin');

const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

(async () => {
  try {
    const tripsSnap = await db.collection('trips').get();
    const plansSnap = await db.collection('plans').get();
    const tripIds = new Set();
    const tripTitles = {};
    for (const tripDoc of tripsSnap.docs) {
      tripIds.add(tripDoc.id);
      tripTitles[tripDoc.id] = tripDoc.data().title || tripDoc.id;
    }
    console.log('=== Voyages ===');
    for (const id of tripIds) {
      console.log(`- ${id} | ${tripTitles[id]}`);
    }
    console.log('\n=== Plans ===');
    for (const planDoc of plansSnap.docs) {
      const plan = planDoc.data();
      const match = tripIds.has(plan.tripId);
      console.log(`- ${planDoc.id} | tripId: ${plan.tripId} | type: ${plan.type} | title: ${plan.title} | Correspondance: ${match ? 'OUI' : 'NON'}`);
    }
    process.exit(0);
  } catch (e) {
    console.error('Erreur:', e);
    process.exit(1);
  }
})(); 