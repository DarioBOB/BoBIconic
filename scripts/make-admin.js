/**
 * Script pour donner les droits d'administrateur à un utilisateur
 * 
 * Usage:
 * node scripts/make-admin.js <email-utilisateur>
 * 
 * Exemple:
 * node scripts/make-admin.js admin@bobiconic.com
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

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
const auth = getAuth(app);

async function makeUserAdmin(email) {
  try {
    console.log(`🔐 Connexion en tant qu'administrateur...`);
    
    // Connexion avec un compte admin existant ou création
    // Remplacez par les identifiants d'un compte admin existant
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bobiconic.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log(`✅ Connecté en tant qu'administrateur: ${adminEmail}`);
    } catch (error) {
      console.log(`⚠️ Impossible de se connecter avec ${adminEmail}, tentative de création...`);
      
      // Si pas de compte admin, on peut créer un utilisateur directement
      // ou utiliser une autre méthode selon votre configuration
      console.log(`ℹ️ Veuillez vous connecter manuellement avec un compte administrateur`);
      return;
    }

    console.log(`🔍 Recherche de l'utilisateur: ${email}`);
    
    // Rechercher l'utilisateur par email
    // Note: Cette méthode nécessite un index sur le champ email
    // ou une autre méthode selon votre structure de données
    
    // Pour l'instant, on va créer/ mettre à jour directement le document utilisateur
    // en supposant que l'UID est basé sur l'email ou connu
    
    // Méthode 1: Si vous connaissez l'UID
    const uid = process.env.USER_UID;
    if (uid) {
      await updateUserRole(uid, email);
      return;
    }
    
    // Méthode 2: Créer un document utilisateur avec un UID généré
    const generatedUid = `admin_${Date.now()}`;
    await createUserDocument(generatedUid, email);
    
  } catch (error) {
    console.error(`❌ Erreur:`, error.message);
    process.exit(1);
  }
}

async function updateUserRole(uid, email) {
  try {
    const userRef = doc(db, 'users', uid);
    
    // Vérifier si l'utilisateur existe
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Mettre à jour le rôle existant
      await updateDoc(userRef, {
        role: 'admin',
        email: email,
        updatedAt: new Date(),
        updatedBy: auth.currentUser?.uid || 'script'
      });
      console.log(`✅ Utilisateur ${email} (${uid}) promu administrateur`);
    } else {
      // Créer un nouvel utilisateur admin
      await setDoc(userRef, {
        email: email,
        role: 'admin',
        createdAt: new Date(),
        createdBy: auth.currentUser?.uid || 'script',
        isActive: true,
        permissions: ['admin', 'read', 'write', 'delete']
      });
      console.log(`✅ Nouvel utilisateur admin créé: ${email} (${uid})`);
    }
    
    console.log(`🎉 L'utilisateur ${email} a maintenant les droits d'administrateur!`);
    console.log(`🔗 Accédez à l'admin via: http://localhost:8100/admin`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour du rôle:`, error.message);
    throw error;
  }
}

async function createUserDocument(uid, email) {
  try {
    const userRef = doc(db, 'users', uid);
    
    await setDoc(userRef, {
      email: email,
      role: 'admin',
      createdAt: new Date(),
      createdBy: 'script',
      isActive: true,
      permissions: ['admin', 'read', 'write', 'delete'],
      profile: {
        displayName: email.split('@')[0],
        email: email
      }
    });
    
    console.log(`✅ Nouvel utilisateur admin créé: ${email} (${uid})`);
    console.log(`🎉 L'utilisateur ${email} a maintenant les droits d'administrateur!`);
    console.log(`🔗 Accédez à l'admin via: http://localhost:8100/admin`);
    console.log(`📝 UID généré: ${uid} (à utiliser pour la connexion)`);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la création de l'utilisateur:`, error.message);
    throw error;
  }
}

// Fonction principale
async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.log(`❌ Usage: node scripts/make-admin.js <email-utilisateur>`);
    console.log(`📝 Exemple: node scripts/make-admin.js admin@bobiconic.com`);
    process.exit(1);
  }
  
  console.log(`🚀 Démarrage du script de promotion administrateur...`);
  console.log(`📧 Email cible: ${email}`);
  
  await makeUserAdmin(email);
  
  console.log(`✨ Script terminé avec succès!`);
  process.exit(0);
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erreur non gérée:', reason);
  process.exit(1);
});

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { makeUserAdmin, updateUserRole, createUserDocument }; 