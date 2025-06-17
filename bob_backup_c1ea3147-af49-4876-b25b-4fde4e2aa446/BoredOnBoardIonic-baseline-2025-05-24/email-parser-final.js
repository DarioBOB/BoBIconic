const admin = require('firebase-admin');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
if (process.env['NODE_ENV'] !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}
const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const imapConfig = {
  user: process.env['ZOHO_EMAIL'],
  password: process.env['ZOHO_PASSWORD'],
  host: 'imap.zoho.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};
async function parseEasyJetEmail(email) {
  try {
    const body = email.text;
    const bookingRefMatch = body.match(/Booking Reference: ([A-Z0-9]+)/);
    if (!bookingRefMatch) return null;
    const bookingRef = bookingRefMatch[1];
    const flightSegments = [];
    const flightRegex = /Flight: ([A-Z0-9]+)\s*From: ([A-Z]{3})\s*To: ([A-Z]{3})\s*Date: (\d{2}\/\d{2}\/\d{4})\s*Time: (\d{2}:\d{2})/g;
    let match;
    while ((match = flightRegex.exec(body)) !== null) {
      const [_, flightNumber, from, to, date, time] = match;
      const departureTime = new Date(`${date} ${time}`);
      const segment = {
        flight_number: flightNumber,
        airline: { name: 'EasyJet', code: 'U2' },
        aircraft: { type: 'A320' },
        departure: { location: { airport_code: from, city: '', country: '' }, scheduled_time: departureTime, status: 'ON_TIME' },
        arrival: { location: { airport_code: to, city: '', country: '' }, scheduled_time: new Date(departureTime.getTime() + 120 * 60000), status: 'ON_TIME' },
        duration: { scheduled_minutes: 120 },
        distance: { kilometers: 0, miles: 0 },
        status: 'SCHEDULED'
      };
      flightSegments.push(segment);
    }
    if (flightSegments.length === 0) return null;
    const trip = {
      user_id: process.env['DEFAULT_USER_ID'] || 'system',
      title: `EasyJet Trip - ${flightSegments[0].departure.location.airport_code} to ${flightSegments[flightSegments.length - 1].arrival.location.airport_code}`,
      type: 'LEISURE',
      status: 'PLANNED',
      dates: { start: flightSegments[0].departure.scheduled_time, end: flightSegments[flightSegments.length - 1].arrival.scheduled_time },
      segments: { flights: flightSegments, hotels: [], car_rentals: [] },
      booking: { references: [bookingRef], confirmation_numbers: [] },
      documents: [],
      created_at: new Date(),
      updated_at: new Date(),
      source: { type: 'EMAIL', provider: 'EasyJet', reference: email.messageId },
      metadata: {}
    };
    return trip;
  } catch (error) { logger.error('Error parsing EasyJet email:', error); return null; }
}
async function parseEmails() {
  const imap = new Imap(imapConfig);
  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) return reject(err);
        imap.search(['UNSEEN'], (err, results) => {
          if (err) return reject(err);
          if (results.length === 0) { imap.end(); return resolve([]); }
          const f = imap.fetch(results, { bodies: '' });
          const trips = [];
          f.on('message', (msg) => {
            msg.on('body', async (stream) => {
              try {
                const parsed = await simpleParser(stream);
                if (parsed.from?.text.includes('easyjet.com')) {
                  const trip = await parseEasyJetEmail(parsed);
                  if (trip) trips.push(trip);
                }
              } catch (error) { logger.error('Error parsing email:', error); }
            });
          });
          f.once('error', (err) => { reject(err); });
          f.once('end', async () => {
            for (const trip of trips) {
              try { await db.collection('trips').add(trip); } catch (error) { logger.error('Error storing trip:', error); }
            }
            imap.end();
            resolve(trips);
          });
        });
      });
    });
    imap.once('error', (err) => { reject(err); });
    imap.connect();
  });
}
if (require.main === module) {
  parseEmails()
    .then(() => { logger.info('Email parsing completed'); process.exit(0); })
    .catch((error) => { logger.error('Email parsing failed:', error); process.exit(1); });
} 