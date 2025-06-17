require('dotenv/config');
const admin = require('firebase-admin');

const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const email = 'bobplans@sunshine-adventures.net';
const password = 'Astaroth001@';

(async () => {
  try {
    // Créer l'utilisateur dans Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log('Utilisateur déjà existant:', userRecord.uid);
    } catch (e) {
      userRecord = await admin.auth().createUser({
        email,
        password
      });
      console.log('Utilisateur créé:', userRecord.uid);
    }
    // Ajouter le champ role: 'admin' dans Firestore
    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      email,
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('Champ role: admin ajouté dans Firestore');
    process.exit(0);
  } catch (e) {
    console.error('Erreur:', e);
    process.exit(1);
  }
})(); 