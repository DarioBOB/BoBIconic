const fs = require('fs');

// Lire le fichier JSON de la clé Firebase
const keyPath = process.argv[2];
if (!keyPath) {
    console.error('Veuillez spécifier le chemin du fichier JSON de la clé Firebase');
    process.exit(1);
}

try {
    const keyContent = fs.readFileSync(keyPath, 'utf8');
    const base64Key = Buffer.from(keyContent).toString('base64');
    console.log('\nClé Firebase encodée en base64 :\n');
    console.log(base64Key);
    console.log('\nCopiez cette clé dans votre fichier .env comme valeur de FIREBASE_KEY\n');
} catch (error) {
    console.error('Erreur lors de la lecture du fichier :', error.message);
    process.exit(1);
} 