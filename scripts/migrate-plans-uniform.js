// Script Node.js pour uniformiser la structure des plans Firestore
// Usage : node scripts/migrate-plans-uniform.js

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

function toTimestamp(val) {
  if (!val) return null;
  if (typeof val === 'object' && val._seconds !== undefined) return val;
  if (val instanceof Date) return admin.firestore.Timestamp.fromDate(val);
  if (typeof val === 'string') {
    const d = new Date(val);
    return admin.firestore.Timestamp.fromDate(d);
  }
  return null;
}

function toTitleObj(val) {
  if (!val) return { fr: '', en: '' };
  if (typeof val === 'object' && (val.fr || val.en)) return { fr: val.fr || '', en: val.en || '' };
  return { fr: val, en: val };
}

function toDescObj(val) {
  if (!val) return { fr: '', en: '' };
  if (typeof val === 'object' && (val.fr || val.en)) return { fr: val.fr || '', en: val.en || '' };
  return { fr: val, en: val };
}

async function migratePlans() {
  const plansSnapshot = await db.collection('plans').get();
  for (const doc of plansSnapshot.docs) {
    const plan = doc.data();
    const id = doc.id;
    let changed = false;
    const updated = {
      id: id,
      tripId: plan.tripId || '',
      userId: plan.userId || '',
      title: toTitleObj(plan.title),
      description: toDescObj(plan.description),
      type: plan.type || 'activity',
      startDate: toTimestamp(plan.startDate),
      endDate: toTimestamp(plan.endDate),
      startTime: plan.startTime ? toTimestamp(plan.startTime) : undefined,
      endTime: plan.endTime ? toTimestamp(plan.endTime) : undefined,
      details: plan.details || {},
      createdByDemo: plan.createdByDemo || false,
      createdAt: toTimestamp(plan.createdAt) || admin.firestore.Timestamp.now(),
      updatedAt: toTimestamp(plan.updatedAt) || admin.firestore.Timestamp.now(),
      status: plan.status || undefined
    };
    // Nettoyage des champs optionnels
    if (!updated.startTime) delete updated.startTime;
    if (!updated.endTime) delete updated.endTime;
    if (!updated.status) delete updated.status;
    // Log et update si différent
    if (JSON.stringify(plan) !== JSON.stringify(updated)) {
      await doc.ref.set(updated, { merge: false });
      console.log(`[MIGRATION] Plan ${id} mis à jour :`, updated);
      changed = true;
    }
    if (!changed) {
      console.log(`[MIGRATION] Plan ${id} déjà conforme.`);
    }
  }
  console.log('--- MIGRATION PLANS TERMINÉE ---');
}

migratePlans().catch(err => {
  console.error('Erreur migration plans:', err);
  process.exit(1);
}); 