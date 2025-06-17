// Script de mise à jour du mot de passe du compte démo Firebase Auth
// ------------------------------------------------------
// Ce script met à jour le mot de passe du compte démo (UID fixe)
// sans toucher à la création ou suppression de l'utilisateur.
// Usage : node backend/scripts/update_demo_password.cjs
// Prérequis : serviceAccount.json à la racine du projet
// ------------------------------------------------------

const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.resolve(__dirname, '../../serviceAccount.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = '6RCIrbnFZqdx7RiQv4mdT4Iwtzx1';
const password = 'DemoPassword123!';

admin.auth().updateUser(uid, { password })
  .then(userRecord => {
    console.log('Mot de passe mis à jour pour UID:', userRecord.uid);
    process.exit(0);
  })
  .catch(error => {
    console.error('Erreur lors de la mise à jour du mot de passe:', error.message);
    process.exit(1);
  }); 