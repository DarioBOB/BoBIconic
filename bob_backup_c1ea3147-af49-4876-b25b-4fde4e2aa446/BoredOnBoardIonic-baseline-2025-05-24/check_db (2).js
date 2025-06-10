import 'dotenv/config';
import admin from 'firebase-admin';
import { Buffer } from 'buffer';

// 🔐 Initialiser Firebase depuis la clé base64
if (!admin.apps.length) {
  const base64Key = process.env.FIREBASE_KEY;
  if (!base64Key) throw new Error('❌ FIREBASE_KEY manquante. Ajoute-la dans les GitHub Secrets.');
  const serviceAccount = JSON.parse(Buffer.from(base64Key, 'base64').toString('utf-8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkTrips() {
  try {
    const tripsSnapshot = await db.collection('trips')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (tripsSnapshot.empty) {
      console.log('❌ Aucun voyage trouvé dans la base de données');
      return;
    }

    tripsSnapshot.forEach(doc => {
      console.log('📝 Dernier voyage trouvé :');
      console.log('ID:', doc.id);
      console.log('Données:', JSON.stringify(doc.data(), null, 2));
    });
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des voyages:', error);
  }
}

checkTrips(); 