/**
 * Script pour corriger les données de démo dans Firestore
 * Ajoute le champ status manquant aux voyages de démo
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = require('firebase/firestore');

// Configuration Firebase (à adapter selon votre projet)
const firebaseConfig = {
  // Remplacez par votre configuration Firebase
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixDemoData() {
  console.log('🔧 Début de la correction des données de démo...');
  
  try {
    // 1. Récupérer tous les voyages de démo
    const tripsQuery = query(collection(db, 'trips'), where('createdByDemo', '==', true));
    const tripsSnapshot = await getDocs(tripsQuery);
    
    if (tripsSnapshot.empty) {
      console.log('❌ Aucun voyage de démo trouvé');
      return;
    }
    
    console.log(`📊 ${tripsSnapshot.docs.length} voyages de démo trouvés`);
    
    // 2. Analyser et corriger chaque voyage
    const trips = [];
    for (const docSnap of tripsSnapshot.docs) {
      const data = docSnap.data();
      trips.push({
        id: docSnap.id,
        ...data
      });
    }
    
    // 3. Trier par date de début pour identifier past, ongoing, future
    trips.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    console.log('📅 Voyages triés par date:');
    trips.forEach((trip, index) => {
      console.log(`  ${index + 1}. ${trip.title} (${trip.startDate})`);
    });
    
    // 4. Assigner les statuts
    const now = new Date();
    const updates = [];
    
    if (trips.length >= 3) {
      // Premier voyage = passé
      const pastTrip = trips[0];
      const pastStart = new Date(pastTrip.startDate);
      if (pastStart < now) {
        updates.push({
          id: pastTrip.id,
          status: 'past',
          title: pastTrip.title
        });
      }
      
      // Deuxième voyage = en cours
      const ongoingTrip = trips[1];
      const ongoingStart = new Date(ongoingTrip.startDate);
      const ongoingEnd = new Date(ongoingTrip.endDate);
      if (ongoingStart <= now && ongoingEnd >= now) {
        updates.push({
          id: ongoingTrip.id,
          status: 'ongoing',
          title: ongoingTrip.title
        });
      }
      
      // Troisième voyage = futur
      const futureTrip = trips[2];
      const futureStart = new Date(futureTrip.startDate);
      if (futureStart > now) {
        updates.push({
          id: futureTrip.id,
          status: 'upcoming',
          title: futureTrip.title
        });
      }
    }
    
    // 5. Appliquer les mises à jour
    console.log('🔄 Application des mises à jour...');
    for (const update of updates) {
      console.log(`  📝 Mise à jour ${update.id} (${update.title}) → status: ${update.status}`);
      await updateDoc(doc(db, 'trips', update.id), {
        status: update.status
      });
    }
    
    console.log('✅ Correction terminée !');
    console.log(`📊 ${updates.length} voyages mis à jour`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

// Exécuter le script
fixDemoData().then(() => {
  console.log('🎉 Script terminé');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
}); 