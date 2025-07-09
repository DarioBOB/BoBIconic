/**
 * Script pour vérifier et créer l'utilisateur démo
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Timeout global de sécurité (30s)
setTimeout(() => {
  console.error('⏰ Timeout atteint, arrêt du script.');
  process.exit(1);
}, 30000);

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
const auth = getAuth(app);
const db = getFirestore(app);

// Configuration démo
const DEMO_EMAIL = 'guestuser@demo.com';
const DEMO_PASSWORD = 'DemoPassword123!';

async function checkAndCreateDemoUser() {
  console.log('🔍 Vérification de l\'utilisateur démo...\n');

  try {
    // 1. Essayer de se connecter avec les identifiants démo
    console.log('1️⃣ Tentative de connexion avec les identifiants démo...');
    let user = null;
    let demoUserId = null;
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
      user = userCredential.user;
      demoUserId = user.uid; // Utiliser l'UID réel retourné par Firebase Auth
      
      console.log(`✅ Utilisateur démo existe et peut se connecter:`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - UID: ${user.uid}`);
      console.log(`   - Email vérifié: ${user.emailVerified}`);
      
      // Vérifier le profil Firestore avec l'UID réel
      const userRef = doc(db, 'users', demoUserId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log(`✅ Profil Firestore trouvé:`);
        console.log(`   - Role: ${userData.role || 'non défini'}`);
        console.log(`   - isDemo: ${userData.isDemo || false}`);
        console.log(`   - Language: ${userData.language || 'non défini'}`);
      } else {
        console.log(`⚠️ Profil Firestore manquant, création...`);
        await setDoc(userRef, {
          email: DEMO_EMAIL,
          role: 'user',
          isDemo: true,
          language: 'fr',
          createdAt: new Date(),
          lastLogin: new Date()
        });
        console.log(`✅ Profil Firestore créé avec UID: ${demoUserId}`);
      }
      
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('❌ Utilisateur démo non trouvé, création...');
        
        // 2. Créer l'utilisateur démo
        const userCredential = await createUserWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
        user = userCredential.user;
        demoUserId = user.uid;
        
        console.log(`✅ Utilisateur démo créé:`);
        console.log(`   - Email: ${user.email}`);
        console.log(`   - UID: ${user.uid}`);
        
        // 3. Créer le profil Firestore avec l'UID réel
        const userRef = doc(db, 'users', demoUserId);
        await setDoc(userRef, {
          email: DEMO_EMAIL,
          role: 'user',
          isDemo: true,
          language: 'fr',
          createdAt: new Date(),
          lastLogin: new Date()
        });
        console.log(`✅ Profil Firestore créé avec UID: ${demoUserId}`);
        
      } else if (error.code === 'auth/wrong-password') {
        console.log('❌ Mot de passe incorrect pour l\'utilisateur démo');
        console.log('   Le mot de passe doit être: DemoPassword123!');
        process.exit(1);
      } else {
        console.error('❌ Erreur lors de la vérification:', error.message);
        process.exit(1);
      }
    }

    // 4. Vérifier les voyages démo
    console.log('\n2️⃣ Vérification des voyages démo...');
    const tripsQuery = query(collection(db, 'trips'), where('createdByDemo', '==', true));
    const tripsSnapshot = await getDocs(tripsQuery);
    
    if (tripsSnapshot.empty) {
      console.log('❌ Aucun voyage démo trouvé');
      console.log('   Exécutez le script de chargement des voyages démo');
    } else {
      console.log(`✅ ${tripsSnapshot.size} voyages démo trouvés`);
      tripsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.title?.fr || data.title}: ${doc.id}`);
      });
    }

    console.log('\n✅ Vérification terminée!');
    console.log(`📝 UID démo à utiliser: ${demoUserId}`);
    console.log('\n📋 Pour tester le mode démo:');
    console.log('   1. Ouvrir http://localhost:8100');
    console.log('   2. Cliquer sur "Tester l\'application"');
    console.log('   3. Vérifier que la connexion fonctionne');
    process.exit(0);

  } catch (error) {
    console.error('💥 Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Catch global pour toute promesse non gérée
process.on('unhandledRejection', (reason) => {
  console.error('💥 Promesse non gérée:', reason);
  process.exit(1);
});

// Exécuter le script
checkAndCreateDemoUser(); 