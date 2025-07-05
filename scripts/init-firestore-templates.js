// Script Node.js pour initialiser la structure Firestore de base (templates) pour BoB
// Usage : node scripts/init-firestore-templates.js

const admin = require('firebase-admin');
const path = require('path');

const TEMPLATE_USER_ID = 'template-user';
const TEMPLATE_TRIP_ID = 'template-trip';

try {
  const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (error) {
  console.error('ERREUR: Le fichier serviceAccountKey.json est introuvable.');
  process.exit(1);
}
const db = admin.firestore();

async function createTemplates() {
  // 1. users/template-user
  const userRef = db.collection('users').doc(TEMPLATE_USER_ID);
  await userRef.set({
    displayName: '',
    email: '',
    preferences: {},
    loyaltyPrograms: [],
    notificationSettings: {},
    createdAt: null,
    updatedAt: null
  });
  console.log('[TEMPLATE] users/template-user créé');

  // 2. users/template-user/trips/template-trip
  const tripRef = userRef.collection('trips').doc(TEMPLATE_TRIP_ID);
  await tripRef.set({
    title: '',
    startDate: null,
    endDate: null,
    origin: {},
    destination: {},
    summary: '',
    currency: '',
    totalBudget: 0,
    createdAt: null,
    updatedAt: null
  });
  console.log('[TEMPLATE] users/template-user/trips/template-trip créé');

  // 3. users/template-user/trips/template-trip/items/{type}
  const items = [
    {
      id: 'template-flight',
      data: {
        type: 'flight', order: 1, title: '', airline: {}, flightNumber: '', callSign: '', confirmationNumber: '',
        aircraftType: '', departureAirport: {}, arrivalAirport: {}, startTime: null, endTime: null, durationMin: 0, distanceKm: 0
      }
    },
    {
      id: 'template-hotel',
      data: {
        type: 'hotel', order: 2, hotelName: '', address: '', checkIn: null, checkOut: null, phone: '', reservationId: ''
      }
    },
    {
      id: 'template-car',
      data: {
        type: 'car', order: 3, company: '', pickupLocation: '', pickupTime: null, dropoffLocation: '', vehicle: {}, reservationId: ''
      }
    },
    {
      id: 'template-ferry',
      data: {
        type: 'ferry', order: 4, company: '', departurePort: '', arrivalPort: '', departureTime: null, arrivalTime: null, cabin: {}, reservationId: ''
      }
    },
    {
      id: 'template-activity',
      data: {
        type: 'activity', order: 5, activityName: '', meetingPoint: '', startTime: null, endTime: null, reservationId: ''
      }
    },
    {
      id: 'template-expense',
      data: {
        type: 'expense', order: 6, title: '', amount: 0, currency: '', category: '', receiptUrl: '', date: null
      }
    },
    {
      id: 'template-document',
      data: {
        type: 'document', order: 7, docType: '', docUrl: '', expiry: null
      }
    }
  ];
  const itemsCol = tripRef.collection('items');
  for (const item of items) {
    await itemsCol.doc(item.id).set(item.data);
    console.log(`[TEMPLATE] item ${item.id} créé`);
  }

  // 4. Créer le voyage template dans la collection racine 'trips'
  const rootTripId = 'template-trip';
  await db.collection('trips').doc(rootTripId).set({
    title: 'Voyage Template',
    userId: TEMPLATE_USER_ID,
    startDate: null,
    endDate: null,
    origin: {},
    destination: {},
    summary: 'Exemple de voyage template pour onboarding',
    currency: '',
    totalBudget: 0,
    createdAt: null,
    updatedAt: null,
    createdByTemplate: true
  });
  console.log('[TEMPLATE] trips/template-trip (racine) créé');

  // 5. Créer les plans template dans la collection racine 'plans'
  for (const item of items) {
    await db.collection('plans').doc(`template-plan-${item.id}`).set({
      ...item.data,
      tripId: rootTripId,
      userId: TEMPLATE_USER_ID,
      createdByTemplate: true
    });
    console.log(`[TEMPLATE] plans/template-plan-${item.id} (racine) créé`);
  }
}

createTemplates().then(() => {
  console.log('--- TEMPLATES FIRESTORE INITIALES CRÉÉS ---');
  process.exit(0);
}).catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
}); 