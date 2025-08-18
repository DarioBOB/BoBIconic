// Script pour effacer tous les voyages et plans du user démo
const { execSync } = require('child_process');

console.log('🗑️ Effacement des données de démo...');

try {
  // Utiliser le script existant qui supprime les données démo
  execSync('node scripts/clean-demo-data.js', { stdio: 'inherit' });
  
  console.log('✅ Données de démo effacées avec succès !');
  
} catch (error) {
  console.error('❌ Erreur lors de l\'effacement:', error.message);
} 