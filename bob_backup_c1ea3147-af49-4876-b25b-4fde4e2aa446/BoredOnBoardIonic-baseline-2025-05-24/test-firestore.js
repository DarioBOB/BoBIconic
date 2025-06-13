const admin = require('firebase-admin');
const serviceAccount = require('./src/scripts/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function testWrite() {
  try {
    const res = await db.collection('plans').add({
      type: 'test',
      title: 'Test Plan Direct',
      createdAt: new Date(),
      details: { test: true }
    });
    console.log('SUCCESS: Plan written with ID:', res.id);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

testWrite(); 