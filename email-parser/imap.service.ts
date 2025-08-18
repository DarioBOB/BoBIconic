import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { EventEmitter } from 'events';

export interface EmailData {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  text: string;
  html: string;
  attachments: any[];
}

export class ImapService extends EventEmitter {
  private imap: Imap;
  private isConnected = false;

  constructor() {
    super();
    
    this.imap = new Imap({
      user: process.env.IMAP_USER || 'bobplans@sunshine-adventures.net',
      password: process.env.IMAP_PASS || 'HzCXsEafd6PK',
      host: process.env.IMAP_HOST || 'imap.zoho.eu',
      port: parseInt(process.env.IMAP_PORT || '993'),
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.imap.on('ready', () => {
      console.log('IMAP connection ready');
      this.isConnected = true;
      this.emit('ready');
    });

    this.imap.on('error', (err) => {
      console.error('IMAP error:', err);
      this.emit('error', err);
    });

    this.imap.on('end', () => {
      console.log('IMAP connection ended');
      this.isConnected = false;
      this.emit('end');
    });
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      this.imap.once('ready', () => resolve());
      this.imap.once('error', reject);
      this.imap.connect();
    });
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      this.imap.end();
    }
  }

  public async getUnreadEmails(): Promise<EmailData[]> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('IMAP not connected'));
        return;
      }

      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Rechercher les emails non lus
        this.imap.search(['UNSEEN'], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (results.length === 0) {
            resolve([]);
            return;
          }

          const emails: EmailData[] = [];
          let processedCount = 0;

          const fetch = this.imap.fetch(results, {
            bodies: '',
            markSeen: true, // Marquer comme lu
            struct: true
          });

          fetch.on('message', (msg, seqno) => {
            let buffer = '';
            let uid: string;

            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('attributes', (attrs) => {
              uid = attrs.uid;
            });

            msg.once('end', async () => {
              try {
                const parsed = await simpleParser(buffer);
                
                const emailData: EmailData = {
                  id: uid,
                  subject: parsed.subject || '',
                  from: parsed.from?.text || '',
                  to: parsed.to?.text || '',
                  date: parsed.date || new Date(),
                  text: parsed.text || '',
                  html: parsed.html || '',
                  attachments: parsed.attachments || []
                };

                emails.push(emailData);
                processedCount++;

                if (processedCount === results.length) {
                  resolve(emails);
                }
              } catch (parseError) {
                console.error('Error parsing email:', parseError);
                processedCount++;
                
                if (processedCount === results.length) {
                  resolve(emails);
                }
              }
            });
          });

          fetch.once('error', reject);
          fetch.once('end', () => {
            if (processedCount === results.length) {
              resolve(emails);
            }
          });
        });
      });
    });
  }
} 