console.log('--- DEBUT SCRIPT IMAP-LIST ---');
const Imap = require('imap');
const dotenv = require('dotenv');
const { simpleParser } = require('mailparser');
dotenv.config();

const imapConfig = {
  user: process.env['ZOHO_EMAIL'],
  password: process.env['ZOHO_PASSWORD'],
  host: 'imappro.zoho.eu',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

console.log('IMAP config:', imapConfig);

const imap = new Imap(imapConfig);

imap.once('ready', () => {
  console.log('✅ Connexion IMAP réussie !');
  imap.openBox('INBOX', false, (err, box) => {
    if (err) { console.error('Erreur openBox:', err); return; }
    imap.search(['UNSEEN'], (err, results) => {
      if (err) { console.error('Erreur search:', err); return; }
      if (results.length === 0) {
        console.log('Aucun email non lu.');
        imap.end();
        return;
      }
      const f = imap.fetch(results, { bodies: '' });
      f.on('message', (msg) => {
        msg.on('body', async (stream) => {
          const parsed = await simpleParser(stream);
          console.log('--- EMAIL NON LU ---');
          console.log('From:', parsed.from?.text);
          console.log('Subject:', parsed.subject);
          console.log('Body:', parsed.text?.slice(0, 500));
        });
      });
      f.once('end', () => {
        imap.end();
      });
    });
  });
});

imap.once('error', (err) => {
  console.error('❌ Erreur de connexion IMAP :', err.message);
});

imap.connect();