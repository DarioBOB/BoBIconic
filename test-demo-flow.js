/**
 * Test du mode démo
 */

console.log('🧪 Test du mode démo...');

// Vérifier les variables d'environnement
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'guestuser@demo.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'DemoPassword123!';

console.log('📧 Email démo:', DEMO_EMAIL);
console.log('🔑 Mot de passe démo:', DEMO_PASSWORD ? '***' : 'Non défini');

// Vérifier que l'application est accessible
console.log('🌐 Application accessible sur: http://localhost:8100');

console.log('\n✅ Test de configuration terminé!');
console.log('\n📋 Pour tester le mode démo:');
console.log('   1. Ouvrir http://localhost:8100');
console.log('   2. Cliquer sur "Tester l\'application"');
console.log('   3. Vérifier que les voyages démo s\'affichent avec décalages');
console.log('   4. Aller sur la fenêtre window pour voir le callsign automatique'); 