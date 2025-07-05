// Script pour tester les nouvelles fonctionnalités du demo.service.ts
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, writeBatch, doc } = require('firebase/firestore');

// Configuration Firebase (utiliser les mêmes variables d'environnement que l'app)
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "bobiconic.firebaseapp.com",
  projectId: "bobiconic",
  storageBucket: "bobiconic.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ID utilisateur démo (utiliser le même que dans demo.service.ts)
const DEMO_USER_ID = 'guest-demo';

async function testNewDemoLogic() {
  try {
    console.log('🧪 Test des nouvelles fonctionnalités de démo...');
    
    // 1. Récupérer les voyages existants
    const tripsQuery = query(collection(db, 'trips'), where('userId', '==', DEMO_USER_ID));
    const tripsSnapshot = await getDocs(tripsQuery);
    const demoTrips = tripsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    console.log(`📊 ${demoTrips.length} voyages démo trouvés`);
    
    if (demoTrips.length < 3) {
      console.log('⚠️ Pas assez de voyages pour tester. Chargement des données de base...');
      const { execSync } = require('child_process');
      execSync('node scripts/load-demo-trips.js', { stdio: 'inherit' });
      return;
    }
    
    // 2. Simuler la logique de setupDynamicDemoData
    const now = new Date();
    const batch = writeBatch(db);
    
    console.log(`\n🕐 Heure actuelle: ${now.toLocaleString('fr-FR')}`);
    
    // Voyage Passé (il y a 3 semaines)
    const pastTrip = demoTrips[0];
    const pastStartDate = new Date(now.getTime() - 21 * 24 * 3600 * 1000);
    const pastEndDate = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
    
    console.log(`\n🏖️ Voyage Passé (${pastTrip.name || pastTrip.title}):`);
    console.log(`   Original: ${new Date(pastTrip.startDate).toLocaleString('fr-FR')} → ${new Date(pastTrip.endDate).toLocaleString('fr-FR')}`);
    console.log(`   Nouveau: ${pastStartDate.toLocaleString('fr-FR')} → ${pastEndDate.toLocaleString('fr-FR')}`);
    
    // Voyage En Cours
    const ongoingTrip = demoTrips[1];
    const totalDurationMs = 3 * 60 * 60 * 1000; // 3 heures
    const ongoingStartDate = new Date(now.getTime() - (totalDurationMs / 3));
    const ongoingEndDate = new Date(now.getTime() + (totalDurationMs * 2 / 3));
    
    console.log(`\n✈️ Voyage En Cours (${ongoingTrip.name || ongoingTrip.title}):`);
    console.log(`   Original: ${new Date(ongoingTrip.startDate).toLocaleString('fr-FR')} → ${new Date(ongoingTrip.endDate).toLocaleString('fr-FR')}`);
    console.log(`   Nouveau: ${ongoingStartDate.toLocaleString('fr-FR')} → ${ongoingEndDate.toLocaleString('fr-FR')}`);
    console.log(`   Position: 1/3 du vol terminé, 2/3 restant`);
    
    // Voyage Futur (dans 3 semaines)
    const futureTrip = demoTrips[2];
    const futureStartDate = new Date(now.getTime() + 21 * 24 * 3600 * 1000);
    const futureEndDate = new Date(now.getTime() + 28 * 24 * 3600 * 1000);
    
    console.log(`\n🛫 Voyage Futur (${futureTrip.name || futureTrip.title}):`);
    console.log(`   Original: ${new Date(futureTrip.startDate).toLocaleString('fr-FR')} → ${new Date(futureTrip.endDate).toLocaleString('fr-FR')}`);
    console.log(`   Nouveau: ${futureStartDate.toLocaleString('fr-FR')} → ${futureEndDate.toLocaleString('fr-FR')}`);
    
    // 3. Appliquer les nouvelles dates
    batch.update(doc(db, 'trips', pastTrip.id), { startDate: pastStartDate, endDate: pastEndDate });
    batch.update(doc(db, 'trips', ongoingTrip.id), { startDate: ongoingStartDate, endDate: ongoingEndDate });
    batch.update(doc(db, 'trips', futureTrip.id), { startDate: futureStartDate, endDate: futureEndDate });
    
    // 4. Mettre à jour les plans avec préservation des horaires
    await updatePlansForTripPreservingTimes(batch, pastTrip.id, pastStartDate, pastEndDate);
    await updatePlansForTripPreservingTimes(batch, ongoingTrip.id, ongoingStartDate, ongoingEndDate);
    await updatePlansForTripPreservingTimes(batch, futureTrip.id, futureStartDate, futureEndDate);
    
    // 5. Commiter les changements
    await batch.commit();
    console.log('\n✅ Nouvelles dates appliquées avec succès !');
    
    // 6. Vérifier le résultat
    console.log('\n🔍 Vérification du résultat...');
    await checkDemoData();
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

async function updatePlansForTripPreservingTimes(batch, tripId, tripStartDate, tripEndDate) {
  const plansQuery = query(collection(db, 'plans'), where('tripId', '==', tripId));
  const plansSnapshot = await getDocs(plansQuery);

  if (plansSnapshot.docs.length === 0) {
    console.log(`[Demo] Aucun plan trouvé pour le voyage ${tripId}`);
    return;
  }

  const plans = plansSnapshot.docs.map(doc => ({
    id: doc.id,
    data: doc.data()
  }));

  // Trouver les dates min/max des plans
  const originalDates = plans
    .map(p => [new Date(p.data['startDate']), new Date(p.data['endDate'])])
    .flat();
  
  const originalStart = new Date(Math.min(...originalDates.map(d => d.getTime())));
  const originalEnd = new Date(Math.max(...originalDates.map(d => d.getTime())));
  const originalDuration = originalEnd.getTime() - originalStart.getTime();
  const newDuration = tripEndDate.getTime() - tripStartDate.getTime();

  console.log(`\n📋 Plans du voyage ${tripId}:`);
  console.log(`   Fenêtre originale: ${originalStart.toLocaleString('fr-FR')} à ${originalEnd.toLocaleString('fr-FR')}`);
  console.log(`   Fenêtre nouvelle: ${tripStartDate.toLocaleString('fr-FR')} à ${tripEndDate.toLocaleString('fr-FR')}`);

  for (const plan of plans) {
    const planStart = new Date(plan.data['startDate']);
    const planEnd = new Date(plan.data['endDate']);
    
    // Calculer la position relative
    const startRatio = originalDuration > 0 ? (planStart.getTime() - originalStart.getTime()) / originalDuration : 0;
    const endRatio = originalDuration > 0 ? (planEnd.getTime() - originalStart.getTime()) / originalDuration : 1;
    
    // Appliquer les ratios
    const newStartDate = new Date(tripStartDate.getTime() + (startRatio * newDuration));
    const newEndDate = new Date(tripStartDate.getTime() + (endRatio * newDuration));
    
    // Préserver l'heure spécifique pour les vols
    if (plan.data['type'] === 'flight' && plan.data['details']?.flight) {
      const flightDetails = plan.data['details'].flight;
      const originalDeparture = new Date(flightDetails.departure_time || planStart);
      const originalArrival = new Date(flightDetails.arrival_time || planEnd);
      
      newStartDate.setHours(originalDeparture.getHours(), originalDeparture.getMinutes(), 0, 0);
      newEndDate.setHours(originalArrival.getHours(), originalArrival.getMinutes(), 0, 0);
      
      batch.update(doc(db, 'plans', plan.id), {
        startDate: newStartDate,
        endDate: newEndDate,
        startTime: newStartDate,
        endTime: newEndDate,
        'details.flight.departure_time': newStartDate.toISOString(),
        'details.flight.arrival_time': newEndDate.toISOString()
      });
    } else {
      batch.update(doc(db, 'plans', plan.id), {
        startDate: newStartDate,
        endDate: newEndDate
      });
    }
    
    console.log(`   • ${plan.data['name'] || plan.data['title']}:`);
    console.log(`     ${planStart.toLocaleString('fr-FR')} → ${newStartDate.toLocaleString('fr-FR')}`);
  }
}

async function checkDemoData() {
  const tripsSnapshot = await getDocs(collection(db, 'trips'));
  const trips = tripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`\n📊 Résultat final - ${trips.length} voyages:`);
  
  for (const trip of trips) {
    console.log(`\n🏖️ ${trip.name || trip.title}:`);
    console.log(`   ${new Date(trip.startDate).toLocaleString('fr-FR')} → ${new Date(trip.endDate).toLocaleString('fr-FR')}`);
    
    const plansSnapshot = await getDocs(query(collection(db, 'plans'), where('tripId', '==', trip.id)));
    const plans = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    for (const plan of plans) {
      const startDate = new Date(plan.startDate);
      const endDate = new Date(plan.endDate);
      console.log(`   • ${plan.name || plan.title}: ${startDate.toLocaleString('fr-FR')} → ${endDate.toLocaleString('fr-FR')}`);
    }
  }
}

// Exécuter le test
testNewDemoLogic(); 