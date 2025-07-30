// Script Node.js pour uniformiser la structure des users Firestore
// Usage : node scripts/migrate-users-uniform.js

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

function getDefaultUser(id, email) {
  return {
    id,
    email: email || '',
    role: 'user',
    displayName: '',
    firstName: { fr: '', en: '' },
    lastName: { fr: '', en: '' },
    preferredLang: 'fr',
    preferences: {},
    loyaltyPrograms: [],
    notificationSettings: {},
    createdAt: null,
    updatedAt: null,
    lastLogin: null
  };
}

async function migrateUsers() {
  const usersSnapshot = await db.collection('users').get();
  for (const doc of usersSnapshot.docs) {
    const user = doc.data();
    const id = doc.id;
    let changed = false;
    let updated = getDefaultUser(id, user.email);

    // Email
    if (user.email) updated.email = user.email;

    // Rôle
    if (id === 'template-user') updated.role = 'template';
    else if (user.isDemo || user.role === 'demo') updated.role = 'demo';
    else if (user.role) updated.role = user.role;
    else if (id === 'fUBBVpboDeaUjD6w2nz0xKni9mG3') updated.role = 'demo';
    else updated.role = 'user';

    // Nom complet
    if (user.displayName) updated.displayName = user.displayName;
    else if (user.name) updated.displayName = user.name;
    else if (user.firstName && user.lastName) {
      const fr = (user.firstName.fr || user.firstName) + ' ' + (user.lastName.fr || user.lastName);
      const en = (user.firstName.en || user.firstName) + ' ' + (user.lastName.en || user.lastName);
      updated.displayName = fr;
      updated.firstName = { fr: user.firstName.fr || user.firstName, en: user.firstName.en || user.firstName };
      updated.lastName = { fr: user.lastName.fr || user.lastName, en: user.lastName.en || user.lastName };
    } else if (user.name) {
      updated.displayName = user.name;
    }

    // Champs multilingues
    if (user.firstName) {
      updated.firstName = typeof user.firstName === 'object' ? user.firstName : { fr: user.firstName, en: user.firstName };
    }
    if (user.lastName) {
      updated.lastName = typeof user.lastName === 'object' ? user.lastName : { fr: user.lastName, en: user.lastName };
    }
    if (user.preferredLang) updated.preferredLang = user.preferredLang;

    // Champs objets/tableaux
    updated.preferences = user.preferences || {};
    updated.loyaltyPrograms = user.loyaltyPrograms || [];
    updated.notificationSettings = user.notificationSettings || {};

    // Champs d'audit
    if (user.createdAt) updated.createdAt = user.createdAt;
    if (user.updatedAt) updated.updatedAt = user.updatedAt;
    if (user.lastLogin) updated.lastLogin = user.lastLogin;

    // Log et update si différent
    if (JSON.stringify(user) !== JSON.stringify(updated)) {
      await doc.ref.set(updated, { merge: false });
      console.log(`[MIGRATION] User ${id} mis à jour :`, updated);
      changed = true;
    }
    if (!changed) {
      console.log(`[MIGRATION] User ${id} déjà conforme.`);
    }
  }
  console.log('--- MIGRATION USERS TERMINÉE ---');
}

migrateUsers().catch(err => {
  console.error('Erreur migration users:', err);
  process.exit(1);
}); 