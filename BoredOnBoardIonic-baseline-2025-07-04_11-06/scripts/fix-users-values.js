// Script Node.js pour corriger les valeurs clés des users Firestore
// Usage : node scripts/fix-users-values.js

const admin = require('firebase-admin');
const path = require('path');

try {
  const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (error) {
  console.error('ERREUR: Le fichier serviceAccountKey.json est introuvable.');
  process.exit(1);
}
const db = admin.firestore();

const updates = [
  {
    id: 'template-user',
    data: {
      email: 'template@bobiconic.com',
      displayName: 'Utilisateur Template',
      firstName: { fr: 'Template', en: 'Template' },
      lastName: { fr: 'Utilisateur', en: 'User' }
    }
  },
  {
    id: 'ZCKWsfB6p4fQxZG17ucCYR9Z6lr2',
    data: {
      displayName: 'Admin Principal',
      firstName: { fr: 'Admin', en: 'Admin' },
      lastName: { fr: 'Principal', en: 'Main' }
    }
  },
  {
    id: 'zKEzqnRzgkcb3xkhs8KeSWw2nOz1',
    data: {
      firstName: { fr: 'Dario', en: 'Dario' },
      lastName: { fr: 'Mangano', en: 'Mangano' }
    }
  }
];

async function fixUsers() {
  for (const upd of updates) {
    const ref = db.collection('users').doc(upd.id);
    const snap = await ref.get();
    if (!snap.exists) {
      console.warn(`[FIX] User ${upd.id} introuvable, ignoré.`);
      continue;
    }
    await ref.update(upd.data);
    console.log(`[FIX] User ${upd.id} mis à jour :`, upd.data);
  }
  console.log('--- FIX USERS TERMINÉ ---');
}

fixUsers().catch(err => {
  console.error('Erreur fix users:', err);
  process.exit(1);
}); 