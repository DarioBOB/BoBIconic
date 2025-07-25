// Script de test pour recharger les données de démo
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

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

async function checkDemoData() {
  try {
    console.log('🔍 Vérification des données de démo...');
    
    // Récupérer tous les voyages
    const tripsSnapshot = await getDocs(collection(db, 'trips'));
    const trips = tripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📊 ${trips.length} voyages trouvés`);
    
    for (const trip of trips) {
      console.log(`\n🏖️ Voyage: ${trip.name || trip.title}`);
      console.log(`   ID: ${trip.id}`);
      console.log(`   Dates: ${new Date(trip.startDate).toLocaleString('fr-FR')} → ${new Date(trip.endDate).toLocaleString('fr-FR')}`);
      
      // Récupérer les plans de ce voyage
      const plansSnapshot = await getDocs(query(collection(db, 'plans'), where('tripId', '==', trip.id)));
      const plans = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log(`   📋 ${plans.length} plans:`);
      
      for (const plan of plans) {
        const startDate = new Date(plan.startDate);
        const endDate = new Date(plan.endDate);
        
        console.log(`      • ${plan.name || plan.title} (${plan.type})`);
        console.log(`        ${startDate.toLocaleString('fr-FR')} → ${endDate.toLocaleString('fr-FR')}`);
        
        if (plan.type === 'flight' && plan.details?.flight) {
          const departure = new Date(plan.details.flight.departure_time);
          const arrival = new Date(plan.details.flight.arrival_time);
          console.log(`        ✈️ Vol: ${departure.toLocaleTimeString('fr-FR')} → ${arrival.toLocaleTimeString('fr-FR')}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter la vérification
checkDemoData(); 