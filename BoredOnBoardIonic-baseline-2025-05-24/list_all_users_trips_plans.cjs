// Script pour lister tous les utilisateurs, leurs voyages et les plans associés
require('dotenv/config');
const admin = require('firebase-admin');

const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

(async () => {
  try {
    const usersSnap = await db.collection('users').get();
    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      const userId = userDoc.id;
      console.log(`\n=== Utilisateur: ${user.email || userId} ===`);
      // Récupère les voyages de l'utilisateur
      const tripsSnap = await db.collection('trips').where('userId', '==', userId).get();
      if (tripsSnap.empty) {
        console.log('  Aucun voyage.');
        continue;
      }
      for (const tripDoc of tripsSnap.docs) {
        const trip = tripDoc.data();
        console.log(`  - Voyage: ${trip.title || tripDoc.id} [${tripDoc.id}]`);
        // Récupère les plans associés à ce voyage
        const plansSnap = await db.collection('plans').where('tripId', '==', tripDoc.id).get();
        if (plansSnap.empty) {
          console.log('      Aucun plan associé.');
        } else {
          for (const planDoc of plansSnap.docs) {
            const plan = planDoc.data();
            console.log(`      * Plan: ${plan.type || 'type inconnu'} | ${plan.title || 'titre inconnu'} [${planDoc.id}]`);
          }
        }
      }
    }
    process.exit(0);
  } catch (e) {
    console.error('Erreur:', e);
    process.exit(1);
  }
})(); 