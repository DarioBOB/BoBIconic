import * as imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as winston from 'winston';

// Load environment variables
dotenv.config();

// Configure logger
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

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// IMAP Configuration
const imapConfig = {
  imap: {
    user: process.env['ZOHO_EMAIL'] || '',
    password: process.env['ZOHO_PASSWORD'] || '',
    host: 'imappro.zoho.eu',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  }
};

// Types
interface FlightSegment {
  flight_number: string;
  airline: { name: string; code: string };
  aircraft: { type: string };
  departure: {
    location: { airport_code: string; city: string; country: string };
    scheduled_time: Date;
    status: string;
  };
  arrival: {
    location: { airport_code: string; city: string; country: string };
    scheduled_time: Date;
    status: string;
  };
  duration: { scheduled_minutes: number };
  distance: { kilometers: number; miles: number };
  status: string;
}

interface Trip {
  user_id: string;
  title: string;
  type: string;
  status: string;
  dates: { start: Date; end: Date };
  segments: {
    flights: FlightSegment[];
    hotels: any[];
    car_rentals: any[];
  };
  booking: {
    references: string[];
    confirmation_numbers: string[];
  };
  documents: any[];
  created_at: Date;
  updated_at: Date;
  source: {
    type: string;
    provider: string;
    reference: string;
  };
  metadata: Record<string, any>;
}

async function parseEasyJetEmail(email: any): Promise<Trip | null> {
  try {
    const body = email.text;
    const bookingRefMatch = body.match(/Booking Reference: ([A-Z0-9]+)/);
    if (!bookingRefMatch) return null;

    const bookingRef = bookingRefMatch[1];
    const flightSegments: FlightSegment[] = [];
    const flightRegex = /Flight: ([A-Z0-9]+)\s*From: ([A-Z]{3})\s*To: ([A-Z]{3})\s*Date: (\d{2}\/\d{2}\/\d{4})\s*Time: (\d{2}:\d{2})/g;
    
    let match;
    while ((match = flightRegex.exec(body)) !== null) {
      const [_, flightNumber, from, to, date, time] = match;
      const departureTime = new Date(`${date} ${time}`);
      
      const segment: FlightSegment = {
        flight_number: flightNumber,
        airline: { name: 'EasyJet', code: 'U2' },
        aircraft: { type: 'A320' },
        departure: {
          location: { airport_code: from, city: '', country: '' },
          scheduled_time: departureTime,
          status: 'ON_TIME'
        },
        arrival: {
          location: { airport_code: to, city: '', country: '' },
          scheduled_time: new Date(departureTime.getTime() + 120 * 60000),
          status: 'ON_TIME'
        },
        duration: { scheduled_minutes: 120 },
        distance: { kilometers: 0, miles: 0 },
        status: 'SCHEDULED'
      };
      flightSegments.push(segment);
    }

    if (flightSegments.length === 0) return null;

    const trip: Trip = {
      user_id: process.env['DEFAULT_USER_ID'] || 'system',
      title: `EasyJet Trip - ${flightSegments[0].departure.location.airport_code} to ${flightSegments[flightSegments.length - 1].arrival.location.airport_code}`,
      type: 'LEISURE',
      status: 'PLANNED',
      dates: {
        start: flightSegments[0].departure.scheduled_time,
        end: flightSegments[flightSegments.length - 1].arrival.scheduled_time
      },
      segments: {
        flights: flightSegments,
        hotels: [],
        car_rentals: []
      },
      booking: {
        references: [bookingRef],
        confirmation_numbers: []
      },
      documents: [],
      created_at: new Date(),
      updated_at: new Date(),
      source: {
        type: 'EMAIL',
        provider: 'EasyJet',
        reference: email.messageId
      },
      metadata: {}
    };

    return trip;
  } catch (error) {
    logger.error('Error parsing EasyJet email:', error);
    return null;
  }
}

async function parseEmails(): Promise<Trip[]> {
  const connection = await imaps.connect(imapConfig);
  const trips: Trip[] = [];

  try {
    await connection.openBox('INBOX');
    
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: [''],
      markSeen: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    
    for (const message of messages) {
      try {
        const parsed = await simpleParser(message.parts[0].body);
        if (parsed.from?.text.includes('easyjet.com')) {
          const trip = await parseEasyJetEmail(parsed);
          if (trip) {
            trips.push(trip);
            await db.collection('trips').add(trip);
          }
        }
      } catch (error) {
        logger.error('Error processing message:', error);
      }
    }

    await connection.end();
    return trips;
  } catch (error) {
    logger.error('Error in parseEmails:', error);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  parseEmails()
    .then(() => {
      logger.info('Email parsing completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Email parsing failed', error);
      process.exit(1);
    });
}

export { parseEmails, parseEasyJetEmail, Trip, FlightSegment }; 