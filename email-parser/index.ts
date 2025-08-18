import dotenv from 'dotenv';
import { ImapService } from './imap.service.js';
import { OpenAIService } from './openai.service.js';
import { StorageService } from './storage.service.js';

// Charger les variables d'environnement
dotenv.config();

export class EmailParser {
  private imapService: ImapService;
  private openaiService: OpenAIService;
  private storageService: StorageService;

  constructor() {
    this.imapService = new ImapService();
    this.openaiService = new OpenAIService();
    this.storageService = new StorageService();
  }

  public async parseEmails(): Promise<{
    emailsProcessed: number;
    emailsParsed: number;
    savedFiles: string[];
    errors: string[];
  }> {
    const result = {
      emailsProcessed: 0,
      emailsParsed: 0,
      savedFiles: [] as string[],
      errors: [] as string[]
    };

    try {
      console.log('🔄 Démarrage du parsing des emails...');

      // 1. Connexion IMAP
      console.log('📧 Connexion au serveur IMAP...');
      await this.imapService.connect();

      // 2. Récupération des emails non lus
      console.log('📥 Récupération des emails non lus...');
      const emails = await this.imapService.getUnreadEmails();
      result.emailsProcessed = emails.length;

      if (emails.length === 0) {
        console.log('✅ Aucun email non lu trouvé');
        return result;
      }

      console.log(`📨 ${emails.length} email(s) non lu(s) trouvé(s)`);

      // 3. Parsing avec OpenAI
      console.log('🤖 Parsing des emails avec OpenAI...');
      const parsedBookings = await this.openaiService.parseMultipleEmails(emails);
      result.emailsParsed = parsedBookings.length;

      console.log(`✅ ${parsedBookings.length} email(s) parsé(s) avec succès`);

      // 4. Sauvegarde des données
      if (parsedBookings.length > 0) {
        console.log('💾 Sauvegarde des données parsées...');
        const savedFiles = await this.storageService.saveMultipleBookings(parsedBookings);
        result.savedFiles = savedFiles;
        console.log(`💾 ${savedFiles.length} fichier(s) sauvegardé(s)`);
      }

      // 5. Déconnexion IMAP
      await this.imapService.disconnect();

      console.log('✅ Parsing terminé avec succès');
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Erreur lors du parsing:', errorMessage);
      result.errors.push(errorMessage);
      
      try {
        await this.imapService.disconnect();
      } catch (disconnectError) {
        console.error('Erreur lors de la déconnexion IMAP:', disconnectError);
      }
      
      return result;
    }
  }

  public async getStats(): Promise<{
    storage: any;
    recentBookings: any[];
  }> {
    try {
      const storageStats = await this.storageService.getStorageStats();
      const recentBookings = await this.storageService.getAllBookings();
      
      return {
        storage: storageStats,
        recentBookings: recentBookings.slice(0, 10) // 10 plus récents
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return {
        storage: { totalFiles: 0, totalSize: 0, types: {}, providers: {} },
        recentBookings: []
      };
    }
  }

  public async searchBookings(query: string): Promise<any[]> {
    try {
      return await this.storageService.searchBookings(query);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return [];
    }
  }

  public async getBookingsByType(type: string): Promise<any[]> {
    try {
      return await this.storageService.getBookingsByType(type);
    } catch (error) {
      console.error('Erreur lors de la récupération par type:', error);
      return [];
    }
  }
}

// Fonction d'export pour utilisation externe
export async function parseEmails(): Promise<any> {
  const parser = new EmailParser();
  return await parser.parseEmails();
}

// Fonction d'export pour les statistiques
export async function getEmailStats(): Promise<any> {
  const parser = new EmailParser();
  return await parser.getStats();
}

// Point d'entrée si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  parseEmails()
    .then((result) => {
      console.log('Résultat du parsing:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
} 