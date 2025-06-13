// Script temporaire pour harmoniser le champ 'type' des plans en snake_case
require('dotenv/config');
const admin = require('firebase-admin');

const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

(async () => {
  try {
    const plansSnap = await db.collection('plans').get();
    let count = 0;
    for (const planDoc of plansSnap.docs) {
      const plan = planDoc.data();
      let type = plan.type;
      if (type && /[A-Z]/.test(type)) {
        const newType = type.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
        if (newType !== type) {
          await planDoc.ref.update({ type: newType });
          console.log(`Corrigé: ${planDoc.id} | ${type} -> ${newType}`);
          count++;
        }
      }
    }
    console.log(`Migration terminée. ${count} plans corrigés.`);
    process.exit(0);
  } catch (e) {
    console.error('Erreur:', e);
    process.exit(1);
  }
})(); 