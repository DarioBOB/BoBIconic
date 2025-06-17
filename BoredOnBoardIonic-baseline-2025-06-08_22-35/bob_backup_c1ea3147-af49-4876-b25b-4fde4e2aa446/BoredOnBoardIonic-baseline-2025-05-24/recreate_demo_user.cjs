// Script de maintenance pour le compte démo Firebase Auth
// ------------------------------------------------------
// Ce script supprime puis recrée l'utilisateur de démo avec l'UID d'origine,
// l'email guestuser@demo.com et le mot de passe DemoPassword123!.
// Il garantit que l'UID reste le même pour garder la cohérence avec Firestore.
// Usage : node backend/scripts/recreate_demo_user.cjs
// Prérequis : serviceAccount.json dans la racine du projet (ou adapter le chemin)
// ------------------------------------------------------

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.resolve(__dirname, '../../serviceAccount.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = 'guestuser@demo.com';
const password = 'DemoPassword123!';
const uid = '6RCIrbnFZqdx7RiQv4mdT4Iwtzx1';

async function recreateDemoUserWithUID() {
  // Supprimer l'utilisateur s'il existe
  try {
    await admin.auth().deleteUser(uid);
    console.log('Utilisateur supprimé (UID existant)');
  } catch (e) {
    console.log('Aucun utilisateur à supprimer (UID non trouvé)');
  }
  // Créer l'utilisateur avec l'UID voulu
  try {
    const userRecord = await admin.auth().createUser({
      uid,
      email,
      password,
      emailVerified: true,
      displayName: 'Guest User',
      disabled: false,
    });
    console.log('Utilisateur démo recréé avec UID:', userRecord.uid);
  } catch (e) {
    console.error('Erreur lors de la création de l\'utilisateur démo:', e.message);
    process.exit(1);
  }
  process.exit(0);
}

recreateDemoUserWithUID(); 