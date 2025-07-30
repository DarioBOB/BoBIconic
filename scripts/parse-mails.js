import { parseEmails, getEmailStats } from '../email-parser/index.js';

async function main() {
  try {
    console.log('🚀 Démarrage du parsing des emails...');
    
    // Parser les emails
    const result = await parseEmails();
    
    console.log('\n📊 Résultats du parsing:');
    console.log(`- Emails traités: ${result.emailsProcessed}`);
    console.log(`- Emails parsés: ${result.emailsParsed}`);
    console.log(`- Fichiers sauvegardés: ${result.savedFiles.length}`);
    
    if (result.errors.length > 0) {
      console.log(`- Erreurs: ${result.errors.length}`);
      result.errors.forEach(error => console.log(`  ❌ ${error}`));
    }
    
    // Afficher les statistiques
    console.log('\n📈 Statistiques actuelles:');
    const stats = await getEmailStats();
    console.log(`- Total fichiers: ${stats.storage.totalFiles}`);
    console.log(`- Types de réservation:`, stats.storage.types);
    console.log(`- Fournisseurs:`, stats.storage.providers);
    
    if (stats.recentBookings.length > 0) {
      console.log('\n📋 Réservations récentes:');
      stats.recentBookings.forEach((booking, index) => {
        console.log(`${index + 1}. ${booking.booking_type} - ${booking.provider} - ${booking.name || booking.location || 'N/A'}`);
      });
    }
    
    console.log('\n✅ Parsing terminé avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors du parsing:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as parseMails }; 