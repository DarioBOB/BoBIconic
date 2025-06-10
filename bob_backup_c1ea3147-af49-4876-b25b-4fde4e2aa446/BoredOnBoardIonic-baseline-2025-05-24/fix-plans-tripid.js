// Script Node.js robuste pour corriger les plans Firestore en ajoutant le champ tripId
let admin, serviceAccount;
try {
  admin = require('firebase-admin');
  serviceAccount = require('../../backend/firebase-service-account.json');
  console.log('[INFO] Utilisation de ../../backend/firebase-service-account.json');
} catch (e1) {
  try {
    serviceAccount = require('../../serviceAccount.json');
    console.log('[INFO] Utilisation de ../../serviceAccount.json');
  } catch (e2) {
    console.error('[ERREUR] Impossible de trouver un fichier de credentials Firebase valide.');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixPlansTripId() {
  const tripsSnap = await db.collection('trips').get();
  let totalPlansCorriges = 0;
  for (const tripDoc of tripsSnap.docs) {
    const tripId = tripDoc.id;
    const tripData = tripDoc.data();
    if (tripData.plans && Array.isArray(tripData.plans)) {
      for (const planId of tripData.plans) {
        const planRef = db.collection('plans').doc(planId);
        const planSnap = await planRef.get();
        if (planSnap.exists) {
          const planData = planSnap.data();
          if (!planData.tripId || planData.tripId !== tripId) {
            await planRef.update({ tripId });
            totalPlansCorriges++;
            console.log(`[OK] Plan ${planId} corrigé avec tripId ${tripId}`);
          }
        }
      }
    }
  }
  console.log(`\n[RESULTAT] Correction terminée. ${totalPlansCorriges} plans corrigés.`);
}

fixPlansTripId(); 