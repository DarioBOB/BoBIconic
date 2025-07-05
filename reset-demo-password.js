// Script Node.js pour réinitialiser le mot de passe du compte démo
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = 'guestuser@demo.com';
const newPassword = 'DemoPassword123!';

async function resetDemoPassword() {
  try {
    // Chercher l'utilisateur par email
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password: newPassword });
    console.log(`Mot de passe réinitialisé pour ${email} (UID: ${user.uid})`);
  } catch (err) {
    console.error('Erreur lors de la réinitialisation du mot de passe :', err.message);
    process.exit(1);
  }
  process.exit(0);
}

resetDemoPassword(); 