const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBQ876_Ci6AWLBV5-nmkqLDKnCI3929v0E",
  authDomain: "bob-app-9cbfe.firebaseapp.com",
  projectId: "bob-app-9cbfe",
  storageBucket: "bob-app-9cbfe.appspot.com",
  messagingSenderId: "163592997424",
  appId: "1:163592997424:web:ece12127e2e3f07a66bbf5",
  measurementId: "G-EMZ3P925JF"
};

async function fixDemoDataPermissions() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('🔧 Début de la correction des permissions des données de démo...');

  // 1. Corriger les trips de démo
  console.log('\n📋 Correction des trips de démo...');
  const tripsSnapshot = await getDocs(collection(db, 'trips'));
  let tripsFixed = 0;
  
  for (const tripDoc of tripsSnapshot.docs) {
    const tripData = tripDoc.data();
    
    // Identifier les trips de démo (par userId ou autres critères)
    const isDemoTrip = tripData.userId === 'fUBBVpboDeaUjD6w2nz0xKni9mG3' || 
                      (tripData.userId && tripData.userId.includes('demo')) ||
                      tripData.createdByDemo === true;
    
    if (isDemoTrip) {
      if (tripData.createdByDemo !== true) {
        await updateDoc(doc(db, 'trips', tripDoc.id), { createdByDemo: true });
        console.log(`✅ Trip de démo corrigé: ${tripDoc.id}`);
        tripsFixed++;
      } else {
        console.log(`ℹ️  Trip de démo déjà correct: ${tripDoc.id}`);
      }
    } else {
      // S'assurer que les trips non-démo ont createdByDemo: false
      if (tripData.createdByDemo === undefined || tripData.createdByDemo === null) {
        await updateDoc(doc(db, 'trips', tripDoc.id), { createdByDemo: false });
        console.log(`🔧 Trip non-démo corrigé: ${tripDoc.id} (createdByDemo: false)`);
        tripsFixed++;
      }
    }
  }

  // 2. Corriger les plans de démo
  console.log('\n📋 Correction des plans de démo...');
  const plansSnapshot = await getDocs(collection(db, 'plans'));
  let plansFixed = 0;
  
  for (const planDoc of plansSnapshot.docs) {
    const planData = planDoc.data();
    
    // Identifier les plans de démo
    const isDemoPlan = planData.createdByDemo === true ||
                      (planData.userId && planData.userId === 'fUBBVpboDeaUjD6w2nz0xKni9mG3') ||
                      (planData.tripId && planData.tripId.includes('demo'));
    
    if (isDemoPlan) {
      if (planData.createdByDemo !== true) {
        await updateDoc(doc(db, 'plans', planDoc.id), { createdByDemo: true });
        console.log(`✅ Plan de démo corrigé: ${planDoc.id}`);
        plansFixed++;
      } else {
        console.log(`ℹ️  Plan de démo déjà correct: ${planDoc.id}`);
      }
    } else {
      // S'assurer que les plans non-démo ont createdByDemo: false
      if (planData.createdByDemo === undefined || planData.createdByDemo === null) {
        await updateDoc(doc(db, 'plans', planDoc.id), { createdByDemo: false });
        console.log(`🔧 Plan non-démo corrigé: ${planDoc.id} (createdByDemo: false)`);
        plansFixed++;
      }
    }
  }

  // 3. Vérifier les sous-collections plans dans trips
  console.log('\n📋 Vérification des sous-collections plans...');
  for (const tripDoc of tripsSnapshot.docs) {
    const tripData = tripDoc.data();
    const isDemoTrip = tripData.createdByDemo === true || 
                      tripData.userId === 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
    
    if (isDemoTrip) {
      try {
        const subPlansSnapshot = await getDocs(collection(db, 'trips', tripDoc.id, 'plans'));
        for (const subPlanDoc of subPlansSnapshot.docs) {
          const subPlanData = subPlanDoc.data();
          if (subPlanData.createdByDemo !== true) {
            await updateDoc(doc(db, 'trips', tripDoc.id, 'plans', subPlanDoc.id), { createdByDemo: true });
            console.log(`✅ Sous-plan de démo corrigé: trips/${tripDoc.id}/plans/${subPlanDoc.id}`);
            plansFixed++;
          }
        }
      } catch (error) {
        console.log(`ℹ️  Pas de sous-collection plans pour le trip: ${tripDoc.id}`);
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