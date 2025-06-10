const path = require('path');
const fs = require('fs');

const credPath = path.resolve(__dirname, '../firebase-service-account.json');
console.log('Chemin absolu utilisé :', credPath);

try {
  const content = fs.readFileSync(credPath, 'utf8');
  console.log('Lecture OK. Début du contenu :');
  console.log(content.slice(0, 200) + '...');
} catch (e) {
  console.error('Erreur lors de la lecture du fichier :', e.message);
  process.exit(1);
}
console.log('Test terminé avec succès.'); 