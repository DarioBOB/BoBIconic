const Imap = require('imap');
const dotenv = require('dotenv');
dotenv.config();

const imapConfig = {
  user: process.env['ZOHO_EMAIL'],
  password: process.env['ZOHO_PASSWORD'],
  host: 'imappro.zoho.eu',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

const imap = new Imap(imapConfig);

imap.once('ready', () => {
  console.log('✅ Connexion IMAP réussie !');
  imap.end();
});

imap.once('error', (err) => {
  console.error('❌ Erreur de connexion IMAP :', err.message);
});

imap.connect();