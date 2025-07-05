/**
 * Script de suppression des données démo avec le SDK Admin
 *
 * Supprime tous les trips et plans marqués comme 'createdByDemo'.
 *
 * Usage : node scripts/delete-demo-data-admin.js
 * Nécessite : le fichier serviceAccountKey.json à la racine.
 */

const admin = require('firebase-admin');
const path = require('path');

// --- Initialisation ---
try {
  const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (error) {
  console.error("ERREUR: Le fichier serviceAccountKey.json est introuvable.");
  console.error("Veuillez télécharger la clé de compte de service depuis votre console Firebase et la placer à la racine du projet.");
  process.exit(1);
}

const db = admin.firestore();

async function deleteDemoData() {
  console.log('--- Démarrage du script de suppression ---');

  const collections = ['plans', 'trips'];
  let totalDeleted = 0;

  try {
    for (const coll of collections) {
      const snapshot = await db.collection(coll).where('createdByDemo', '==', true).get();
      if (snapshot.empty) {
        console.log(`- Aucun document à supprimer dans "${coll}".`);
        continue;
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      console.log(`- ${snapshot.size} documents supprimés de "${coll}".`);
      totalDeleted += snapshot.size;
    }

    if (totalDeleted > 0) {
      console.log('\n✅ Suppression terminée avec succès.');
    } else {
      console.log('\n✅ Aucune donnée de démo à supprimer.');
    }
  } catch (error) {
    console.error("❌ ERREUR LORS DE LA SUPPRESSION :", error);
    process.exit(1);
  }
}

deleteDemoData(); 