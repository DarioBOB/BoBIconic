import * as admin from 'firebase-admin';

const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function wipeCollection(collectionName: string) {
  const snap = await db.collection(collectionName).get();
  let count = 0;
  for (const doc of snap.docs) {
    await doc.ref.delete();
    count++;
  }
  return count;
}

async function wipeAll() {
  console.warn('⚠️ ATTENTION : Ce script va SUPPRIMER TOUS les voyages, plans et users dans Firestore !');
  console.warn('Utilisation à vos risques et périls.');
  const trips = await wipeCollection('trips');
  const plans = await wipeCollection('plans');
  const users = await wipeCollection('users');
  console.log(`Suppression terminée : ${trips} voyages, ${plans} plans, ${users} users supprimés.`);
}

wipeAll().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); }); 