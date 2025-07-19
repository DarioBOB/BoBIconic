const admin = require('firebase-admin');
const path = require('path');

// Chemin vers la clé de service téléchargée
const serviceAccount = require(path.resolve(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fixDemoDataPermissions() {
  console.log('🔧 [ADMIN] Début de la correction des permissions des données de démo...');

  // 1. Corriger les trips
  const tripsSnapshot = await db.collection('trips').get();
  let tripsFixed = 0;
  for (const tripDoc of tripsSnapshot.docs) {
    const tripData = tripDoc.data();
    const isDemoTrip = tripData.userId === 'fUBBVpboDeaUjD6w2nz0xKni9mG3' ||
      (tripData.userId && tripData.userId.includes('demo')) ||
      tripData.createdByDemo === true;
    if (isDemoTrip) {
      if (tripData.createdByDemo !== true) {
        await tripDoc.ref.update({ createdByDemo: true });
        console.log(`✅ Trip de démo corrigé: ${tripDoc.id}`);
        tripsFixed++;
      }
    } else {
      if (tripData.createdByDemo !== false) {
        await tripDoc.ref.update({ createdByDemo: false });
        console.log(`🔧 Trip non-démo corrigé: ${tripDoc.id}`);
        tripsFixed++;
      }
    }
  }

  // 2. Corriger les plans
  const plansSnapshot = await db.collection('plans').get();
  let plansFixed = 0;
  for (const planDoc of plansSnapshot.docs) {
    const planData = planDoc.data();
    const isDemoPlan = planData.createdByDemo === true ||
      (planData.userId && planData.userId === 'fUBBVpboDeaUjD6w2nz0xKni9mG3') ||
      (planData.tripId && planData.tripId.includes('demo'));
    if (isDemoPlan) {
      if (planData.createdByDemo !== true) {
        await planDoc.ref.update({ createdByDemo: true });
        console.log(`✅ Plan de démo corrigé: ${planDoc.id}`);
        plansFixed++;
      }
    } else {
      if (planData.createdByDemo !== false) {
        await planDoc.ref.update({ createdByDemo: false });
        console.log(`🔧 Plan non-démo corrigé: ${planDoc.id}`);
        plansFixed++;
      }
    }
  }

  // 3. Corriger les sous-collections plans dans trips
  for (const tripDoc of tripsSnapshot.docs) {
    const tripData = tripDoc.data();
    const isDemoTrip = tripData.createdByDemo === true || tripData.userId === 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
    if (isDemoTrip) {
      const subPlansSnapshot = await db.collection('trips').doc(tripDoc.id).collection('plans').get();
      for (const subPlanDoc of subPlansSnapshot.docs) {
        const subPlanData = subPlanDoc.data();
        if (subPlanData.createdByDemo !== true) {
          await subPlanDoc.ref.update({ createdByDemo: true });
          console.log(`✅ Sous-plan de démo corrigé: trips/${tripDoc.id}/plans/${subPlanDoc.id}`);
          plansFixed++;
        }
      }
    }
  }

  console.log(`\n🎉 Correction terminée !`);
  console.log(`📊 Résumé:`);
  console.log(`   - Trips corrigés: ${tripsFixed}`);
  console.log(`   - Plans corrigés: ${plansFixed}`);
  console.log(`\n✅ Toutes les données de démo ont maintenant createdByDemo: true`);
  console.log(`✅ Toutes les données non-démo ont maintenant createdByDemo: false`);
  console.log(`\n🚀 Le mode démo devrait maintenant fonctionner sans erreurs de permissions !`);
}

fixDemoDataPermissions()
  .then(() => {
    console.log('\n✨ Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }); 