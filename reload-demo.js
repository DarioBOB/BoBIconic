// Script pour recharger les données de démo avec les nouvelles modifications
const { execSync } = require('child_process');

console.log('🔄 Rechargement des données de démo...');

try {
  // 1. Charger les données de base
  console.log('📥 Chargement des données de base...');
  execSync('node scripts/load-demo-trips.js', { stdio: 'inherit' });
  
  console.log('\n✅ Données de démo rechargées avec succès !');
  console.log('\n📝 Prochaines étapes :');
  console.log('1. Ouvrez l\'application en mode démo');
  console.log('2. Vérifiez que les voyages ont maintenant des dates éloignées :');
  console.log('   - Passé : il y a 3 semaines');
  console.log('   - En cours : maintenant (vol en cours)');
  console.log('   - Futur : dans 3 semaines');
  console.log('3. Vérifiez que chaque plan a ses propres horaires (pas tous identiques)');
  
} catch (error) {
  console.error('❌ Erreur lors du rechargement:', error.message);
} 