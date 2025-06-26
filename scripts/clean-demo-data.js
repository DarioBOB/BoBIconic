/**
 * Script de nettoyage des données démo de Firestore
 * 
 * Ce script supprime tous les voyages et plans créés par l'utilisateur démo
 * 
 * Usage: node scripts/clean-demo-data.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc } = require('firebase/firestore');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBQ876_Ci6AWLBV5-nmkqLDKnCI3929v0E",
  authDomain: "bob-app-9cbfe.firebaseapp.com",
  projectId: "bob-app-9cbfe",
  storageBucket: "bob-app-9cbfe.appspot.com",
  messagingSenderId: "163592997424",
  appId: "1:163592997424:web:ece12127e2e3f07a66bbf5",
  measurementId: "G-EMZ3P925JF"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ID de l'utilisateur démo
const DEMO_USER_ID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';

/**
 * Supprime tous les plans d'un voyage
 */
async function deletePlansForTrip(tripId) {
  console.log(`🗑️ Suppression des plans pour le voyage ${tripId}...`);
  
  const plansQuery = query(
    collection(db, 'plans'),
    where('tripId', '==', tripId)
  );
  
  const plansSnapshot = await getDocs(plansQuery);
  let deletedCount = 0;
  
  for (const planDoc of plansSnapshot.docs) {
    await deleteDoc(doc(db, 'plans', planDoc.id));
    deletedCount++;
  }
  
  console.log(`✅ ${deletedCount} plans supprimés pour le voyage ${tripId}`);
  return deletedCount;
}

/**
 * Supprime tous les voyages démo
 */
async function deleteDemoTrips() {
  console.log('🗑️ Suppression des voyages démo...');
  
  const tripsQuery = query(
    collection(db, 'trips'),
    where('userId', '==', DEMO_USER_ID),
    where('createdByDemo', '==', true)
  );
  
  const tripsSnapshot = await getDocs(tripsQuery);
  let deletedTrips = 0;
  let deletedPlans = 0;
  
  for (const tripDoc of tripsSnapshot.docs) {
    const tripId = tripDoc.id;
    console.log(`🗑️ Suppression du voyage: ${tripDoc.data().title?.fr || tripDoc.data().title?.en || tripId}`);
    
    // Supprimer d'abord tous les plans du voyage
    const plansDeleted = await deletePlansForTrip(tripId);
    deletedPlans += plansDeleted;
    
    // Puis supprimer le voyage
    await deleteDoc(doc(db, 'trips', tripId));
    deletedTrips++;
  }
  
  console.log(`✅ ${deletedTrips} voyages démo supprimés`);
  console.log(`✅ ${deletedPlans} plans démo supprimés au total`);
  
  return { trips: deletedTrips, plans: deletedPlans };
}

/**
 * Supprime tous les plans démo orphelins
 */
async function deleteOrphanedDemoPlans() {
  console.log('🗑️ Suppression des plans démo orphelins...');
  
  const plansQuery = query(
    collection(db, 'plans'),
    where('userId', '==', DEMO_USER_ID),
    where('createdByDemo', '==', true)
  );
  
  const plansSnapshot = await getDocs(plansQuery);
  let deletedCount = 0;
  
  for (const planDoc of plansSnapshot.docs) {
    await deleteDoc(doc(db, 'plans', planDoc.id));
    deletedCount++;
  }
  
  console.log(`✅ ${deletedCount} plans démo orphelins supprimés`);
  return deletedCount;
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('🧹 Début du nettoyage des données démo...');
    console.log(`👤 Utilisateur démo: ${DEMO_USER_ID}`);
    
    // Supprimer les voyages démo et leurs plans
    const { trips, plans } = await deleteDemoTrips();
    
    // Supprimer les plans démo orphelins
    const orphanedPlans = await deleteOrphanedDemoPlans();
    
    console.log('🎉 Nettoyage terminé !');
    console.log(`📊 Résumé:`);
    console.log(`   - Voyages supprimés: ${trips}`);
    console.log(`   - Plans supprimés: ${plans + orphanedPlans}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { main, deleteDemoTrips, deleteOrphanedDemoPlans }; 