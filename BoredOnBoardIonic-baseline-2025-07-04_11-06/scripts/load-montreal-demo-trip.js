/**
 * Script de chargement du voyage démo Montréal dans Firestore
 * 
 * Ce script crée un voyage complet "Genève-Montréal / Road Trip Québec 15 jours"
 * pour l'utilisateur démo avec tous les plans détaillés.
 * 
 * Usage: node scripts/load-montreal-demo-trip.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, setDoc, Timestamp } = require('firebase/firestore');

// Configuration Firebase (utiliser les mêmes clés que l'app)
const firebaseConfig = {
  apiKey: "AIzaSyBQ876_Ci6AWLBV5-nmkqLDKnCI3929v0E",
  authDomain: "bob-app-9cbfe.firebaseapp.com",
  projectId: "bob-app-9cbfe",
  storageBucket: "bob-app-9cbfe.appspot.com",
  messagingSenderId: "163592997424",
  appId: "1:163592997424:web:ece12127e2e3f07a66bbf5",
  measurementId: "G-EMZ3P925JF"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ID de l'utilisateur démo
const DEMO_USER_ID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';

// Dates de base du voyage (seront recalculées dynamiquement dans l'app)
const BASE_START_DATE = new Date('2025-09-10T00:00:00Z');
const BASE_END_DATE = new Date('2025-09-25T23:59:59Z');

/**
 * Crée le voyage principal
 */
async function createMainTrip() {
  console.log('🛫 Création du voyage principal...');
  
  const tripData = {
    title: {
      fr: 'Genève – Montréal / Road Trip Québec 15 jours',
      en: 'Geneva – Montreal / Quebec Road Trip 15 days'
    },
    description: {
      fr: 'Voyage démo complet avec vol, hébergements, activités et locations de voiture au Québec',
      en: 'Complete demo trip with flight, accommodations, activities and car rentals in Quebec'
    },
    startDate: Timestamp.fromDate(BASE_START_DATE),
    endDate: Timestamp.fromDate(BASE_END_DATE),
    userId: DEMO_USER_ID,
    type: 'vacation',
    from: 'Genève',
    to: 'Montréal',
    createdByDemo: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  const tripRef = await addDoc(collection(db, 'trips'), tripData);
  console.log(`✅ Voyage créé avec ID: ${tripRef.id}`);
  return tripRef.id;
}

/**
 * Crée un plan de vol
 */
async function createFlightPlan(tripId, flightData) {
  const planData = {
    tripId: tripId,
    type: 'flight',
    title: flightData.title,
    description: flightData.description,
    startDate: Timestamp.fromDate(flightData.startDate),
    endDate: Timestamp.fromDate(flightData.endDate),
    startTime: Timestamp.fromDate(flightData.startDate),
    endTime: Timestamp.fromDate(flightData.endDate),
    userId: DEMO_USER_ID,
    createdByDemo: true,
    details: {
      flight: {
        flight_number: flightData.flightNumber,
        airline: flightData.airline,
        aircraft: flightData.aircraft,
        departure: flightData.departure,
        arrival: flightData.arrival,
        confirmation: flightData.confirmation,
        duration: flightData.duration
      }
    }
  };

  const planRef = await addDoc(collection(db, 'plans'), planData);
  console.log(`✈️ Plan de vol créé: ${flightData.flightNumber}`);
  return planRef.id;
}

/**
 * Crée un plan d'hébergement
 */
async function createHotelPlan(tripId, hotelData) {
  const planData = {
    tripId: tripId,
    type: 'hotel',
    title: hotelData.title,
    description: hotelData.description,
    startDate: Timestamp.fromDate(hotelData.checkIn),
    endDate: Timestamp.fromDate(hotelData.checkOut),
    userId: DEMO_USER_ID,
    createdByDemo: true,
    details: {
      hotel: {
        name: hotelData.name,
        address: hotelData.address,
        phone: hotelData.phone,
        checkIn: hotelData.checkIn,
        checkOut: hotelData.checkOut
      }
    }
  };

  const planRef = await addDoc(collection(db, 'plans'), planData);
  console.log(`🏨 Plan hôtel créé: ${hotelData.name}`);
  return planRef.id;
}

/**
 * Crée un plan de location de voiture
 */
async function createCarRentalPlan(tripId, carData) {
  const planData = {
    tripId: tripId,
    type: 'car_rental',
    title: carData.title,
    description: carData.description,
    startDate: Timestamp.fromDate(carData.startDate),
    endDate: Timestamp.fromDate(carData.endDate),
    userId: DEMO_USER_ID,
    createdByDemo: true,
    details: {
      car_rental: {
        company: carData.company,
        location: carData.location,
        address: carData.address,
        model: carData.model,
        reservation: carData.reservation
      }
    }
  };

  const planRef = await addDoc(collection(db, 'plans'), planData);
  console.log(`🚗 Plan location créé: ${carData.company}`);
  return planRef.id;
}

/**
 * Crée un plan d'activité
 */
async function createActivityPlan(tripId, activityData) {
  const planData = {
    tripId: tripId,
    type: 'activity',
    title: activityData.title,
    description: activityData.description,
    startDate: Timestamp.fromDate(activityData.startDate),
    endDate: Timestamp.fromDate(activityData.endDate),
    userId: DEMO_USER_ID,
    createdByDemo: true,
    details: {
      activity: {
        name: activityData.name,
        location: activityData.location,
        duration: activityData.duration,
        reservation: activityData.reservation,
        guide: activityData.guide
      }
    }
  };

  const planRef = await addDoc(collection(db, 'plans'), planData);
  console.log(`🎟️ Plan activité créé: ${activityData.name}`);
  return planRef.id;
}

/**
 * Charge tous les plans du voyage
 */
async function loadAllPlans(tripId) {
  console.log('📋 Chargement de tous les plans...');

  // Vol aller - Genève à Montréal
  await createFlightPlan(tripId, {
    title: { fr: 'Vol U2 5129 Genève → Montréal', en: 'Flight U2 5129 Geneva → Montreal' },
    description: { fr: 'Vol direct EasyJet vers Montréal-Trudeau', en: 'Direct EasyJet flight to Montreal-Trudeau' },
    startDate: new Date('2025-09-10T08:40:00Z'), // 10h40 UTC+2
    endDate: new Date('2025-09-10T17:00:00Z'),   // 13h00 UTC-4
    flightNumber: 'U2 5129',
    airline: 'EasyJet',
    aircraft: 'Airbus A320',
    departure: { code: 'GVA', city: 'Genève', name: 'Aéroport de Genève' },
    arrival: { code: 'YUL', city: 'Montréal', name: 'Aéroport Montréal-Trudeau' },
    confirmation: 'EZK52P9',
    duration: '8h20'
  });

  // Location voiture - Montréal
  await createCarRentalPlan(tripId, {
    title: { fr: 'Location voiture - Montréal', en: 'Car rental - Montreal' },
    description: { fr: 'Location Avis à l\'aéroport de Montréal', en: 'Avis car rental at Montreal airport' },
    startDate: new Date('2025-09-10T17:30:00Z'), // 13h30 UTC-4
    endDate: new Date('2025-09-25T14:00:00Z'),   // 10h00 UTC-4
    company: 'Avis',
    location: 'Montréal Aéroport YUL',
    address: '975 Blvd. Roméo-Vachon N, Dorval, QC H4Y 1H1',
    model: 'Toyota RAV4 automatique',
    reservation: 'MONTREAL2025AVIS'
  });

  // Hôtel Montréal (10-12 sept.)
  await createHotelPlan(tripId, {
    title: { fr: 'Hôtel Bonaventure Montréal', en: 'Hotel Bonaventure Montreal' },
    description: { fr: 'Hébergement au centre-ville de Montréal', en: 'Downtown Montreal accommodation' },
    checkIn: new Date('2025-09-10T19:00:00Z'),  // 15h00 UTC-4
    checkOut: new Date('2025-09-12T15:00:00Z'), // 11h00 UTC-4
    name: 'Hôtel Bonaventure Montréal',
    address: '900 Rue de la Gauchetière O, Montréal, QC H5A 1E4',
    phone: '+1 514-878-2332'
  });

  // Activité - Vieux-Montréal & Mont Royal
  await createActivityPlan(tripId, {
    title: { fr: 'Vieux-Montréal & Mont Royal', en: 'Old Montreal & Mount Royal' },
    description: { fr: 'Visite guidée historique + montée Mont Royal', en: 'Historical guided tour + Mount Royal climb' },
    startDate: new Date('2025-09-11T13:00:00Z'), // 09h00 UTC-4
    endDate: new Date('2025-09-11T16:30:00Z'),   // 12h30 UTC-4
    name: 'Visite guidée historique + montée Mont Royal',
    location: 'Place d\'Armes, Vieux-Montréal',
    duration: '3h30',
    reservation: 'HISTO-VMX21',
    guide: 'Guide en français'
  });

  // Route Montréal → Québec City
  await createActivityPlan(tripId, {
    title: { fr: 'Route Montréal → Québec City', en: 'Route Montreal → Quebec City' },
    description: { fr: 'Trajet en voiture vers Québec City', en: 'Car journey to Quebec City' },
    startDate: new Date('2025-09-12T15:00:00Z'), // 11h00 UTC-4
    endDate: new Date('2025-09-12T18:30:00Z'),   // 14h30 UTC-4
    name: 'Route vers Québec City',
    location: 'Montréal → Québec City',
    duration: '3h30',
    reservation: null,
    guide: null
  });

  // Hôtel Québec City (12-15 sept.)
  await createHotelPlan(tripId, {
    title: { fr: 'Auberge Saint-Antoine', en: 'Auberge Saint-Antoine' },
    description: { fr: 'Hébergement dans le Vieux-Québec', en: 'Accommodation in Old Quebec' },
    checkIn: new Date('2025-09-12T19:00:00Z'),  // 15h00 UTC-4
    checkOut: new Date('2025-09-15T14:30:00Z'), // 10h30 UTC-4
    name: 'Auberge Saint-Antoine',
    address: '8 Rue Saint-Antoine, Vieux-Québec, QC G1K 4C9',
    phone: null
  });

  // Activité - Chute Montmorency + Croisière
  await createActivityPlan(tripId, {
    title: { fr: 'Chute Montmorency + Croisière', en: 'Montmorency Falls + Cruise' },
    description: { fr: 'Visite de la chute et croisière sur le fleuve', en: 'Falls visit and river cruise' },
    startDate: new Date('2025-09-13T13:00:00Z'), // 09h00 UTC-4
    endDate: new Date('2025-09-13T17:00:00Z'),   // 13h00 UTC-4
    name: 'Chute Montmorency + Croisière',
    location: 'Quai de Québec',
    duration: '4h00',
    reservation: 'CROQ2025',
    guide: 'Guide bilingue'
  });

  // Vol interne Québec → Gaspé
  await createFlightPlan(tripId, {
    title: { fr: 'Vol AC8832 Québec → Gaspé', en: 'Flight AC8832 Quebec → Gaspe' },
    description: { fr: 'Vol interne Air Canada vers Gaspé', en: 'Internal Air Canada flight to Gaspe' },
    startDate: new Date('2025-09-15T13:30:00Z'), // 09h30 UTC-4
    endDate: new Date('2025-09-15T14:45:00Z'),   // 10h45 UTC-4
    flightNumber: 'AC8832',
    airline: 'Air Canada',
    aircraft: 'Bombardier CRJ',
    departure: { code: 'YQB', city: 'Québec', name: 'Aéroport de Québec' },
    arrival: { code: 'YGP', city: 'Gaspé', name: 'Aéroport de Gaspé' },
    confirmation: 'INT-YQB-GSP-SEP',
    duration: '1h15'
  });

  // Location Gaspé
  await createCarRentalPlan(tripId, {
    title: { fr: 'Location voiture - Gaspé', en: 'Car rental - Gaspe' },
    description: { fr: 'Location Budget à Gaspé', en: 'Budget car rental in Gaspe' },
    startDate: new Date('2025-09-15T15:00:00Z'), // 11h00 UTC-4
    endDate: new Date('2025-09-18T14:00:00Z'),   // 10h00 UTC-4
    company: 'Budget',
    location: 'Gaspé',
    address: '75 Rue de l\'Aéroport, Gaspé, QC G4X 2K1',
    model: 'Voiture compacte',
    reservation: 'GASPE-BUDGET'
  });

  // Hôtel Gaspé (15-18 sept.)
  await createHotelPlan(tripId, {
    title: { fr: 'Hôtel Baker Gaspé', en: 'Hotel Baker Gaspe' },
    description: { fr: 'Hébergement à Gaspé', en: 'Accommodation in Gaspe' },
    checkIn: new Date('2025-09-15T17:30:00Z'),  // 13h30 UTC-4
    checkOut: new Date('2025-09-18T14:00:00Z'), // 10h00 UTC-4
    name: 'Hôtel Baker Gaspé',
    address: '178 Rue de la Reine, Gaspé, QC G4X 1T6',
    phone: null
  });

  // Excursion - Parc Forillon + Baleines
  await createActivityPlan(tripId, {
    title: { fr: 'Parc Forillon + Baleines', en: 'Forillon Park + Whales' },
    description: { fr: 'Observation des baleines en Zodiac', en: 'Whale watching by Zodiac' },
    startDate: new Date('2025-09-16T12:00:00Z'), // 08h00 UTC-4
    endDate: new Date('2025-09-16T16:30:00Z'),   // 12h30 UTC-4
    name: 'Parc Forillon + Observation baleines',
    location: 'Cap-des-Rosiers, Forillon',
    duration: '4h30',
    reservation: 'BALEINE-FR88',
    guide: 'Guide spécialisé'
  });

  // Route Gaspé → Percé
  await createActivityPlan(tripId, {
    title: { fr: 'Route Gaspé → Percé', en: 'Route Gaspe → Perce' },
    description: { fr: 'Trajet vers Percé', en: 'Journey to Perce' },
    startDate: new Date('2025-09-18T14:00:00Z'), // 10h00 UTC-4
    endDate: new Date('2025-09-18T15:30:00Z'),   // 11h30 UTC-4
    name: 'Route vers Percé',
    location: 'Gaspé → Percé',
    duration: '1h30',
    reservation: null,
    guide: null
  });

  // Hôtel Percé (18-20 sept.)
  await createHotelPlan(tripId, {
    title: { fr: 'Hôtel Riôtel Percé', en: 'Hotel Riotel Perce' },
    description: { fr: 'Hébergement à Percé', en: 'Accommodation in Perce' },
    checkIn: new Date('2025-09-18T16:00:00Z'),  // 12h00 UTC-4
    checkOut: new Date('2025-09-20T14:00:00Z'), // 10h00 UTC-4
    name: 'Hôtel Riôtel Percé',
    address: '261 Route 132, Percé, QC G0C 2L0',
    phone: null
  });

  // Excursion - Rocher Percé + Île Bonaventure
  await createActivityPlan(tripId, {
    title: { fr: 'Rocher Percé + Île Bonaventure', en: 'Perce Rock + Bonaventure Island' },
    description: { fr: 'Bateau + randonnée libre', en: 'Boat + free hiking' },
    startDate: new Date('2025-09-19T13:00:00Z'), // 09h00 UTC-4
    endDate: new Date('2025-09-19T18:00:00Z'),   // 14h00 UTC-4
    name: 'Rocher Percé + Île Bonaventure',
    location: 'Percé',
    duration: '5h00',
    reservation: 'ILEBONAV2025',
    guide: 'Guide local'
  });

  // Route Percé → Rimouski
  await createActivityPlan(tripId, {
    title: { fr: 'Route Percé → Rimouski', en: 'Route Perce → Rimouski' },
    description: { fr: 'Trajet vers Rimouski avec pause déjeuner', en: 'Journey to Rimouski with lunch break' },
    startDate: new Date('2025-09-20T12:00:00Z'), // 08h00 UTC-4
    endDate: new Date('2025-09-20T20:30:00Z'),   // 16h30 UTC-4
    name: 'Route vers Rimouski',
    location: 'Percé → Rimouski (via Matane)',
    duration: '8h30',
    reservation: null,
    guide: null
  });

  // Hôtel Rimouski (20-21 sept.)
  await createHotelPlan(tripId, {
    title: { fr: 'Hôtel Rimouski', en: 'Hotel Rimouski' },
    description: { fr: 'Hébergement à Rimouski', en: 'Accommodation in Rimouski' },
    checkIn: new Date('2025-09-20T19:00:00Z'),  // 15h00 UTC-4
    checkOut: new Date('2025-09-21T14:00:00Z'), // 10h00 UTC-4
    name: 'Hôtel Rimouski',
    address: '225 Blvd René-Lepage E, Rimouski, QC G5L 1P2',
    phone: null
  });

  // Visite - Sous-marin Onondaga + Phare
  await createActivityPlan(tripId, {
    title: { fr: 'Sous-marin Onondaga + Phare', en: 'Onondaga Submarine + Lighthouse' },
    description: { fr: 'Visite du sous-marin et du phare', en: 'Submarine and lighthouse visit' },
    startDate: new Date('2025-09-20T21:00:00Z'), // 17h00 UTC-4
    endDate: new Date('2025-09-20T23:00:00Z'),   // 19h00 UTC-4
    name: 'Sous-marin Onondaga + Phare',
    location: 'Pointe-au-Père',
    duration: '2h00',
    reservation: null,
    guide: 'Audio-guide FR/EN'
  });

  // Route Rimouski → Tadoussac (via ferry)
  await createActivityPlan(tripId, {
    title: { fr: 'Route Rimouski → Tadoussac', en: 'Route Rimouski → Tadoussac' },
    description: { fr: 'Trajet avec ferry vers Baie-Comeau', en: 'Journey with ferry to Baie-Comeau' },
    startDate: new Date('2025-09-21T15:00:00Z'), // 11h00 UTC-4
    endDate: new Date('2025-09-21T17:00:00Z'),   // 13h00 UTC-4
    name: 'Route vers Tadoussac (ferry)',
    location: 'Rimouski → Tadoussac (ferry)',
    duration: '2h00',
    reservation: null,
    guide: null
  });

  // Hôtel Tadoussac (21-23 sept.)
  await createHotelPlan(tripId, {
    title: { fr: 'Hôtel Tadoussac', en: 'Hotel Tadoussac' },
    description: { fr: 'Hébergement à Tadoussac', en: 'Accommodation in Tadoussac' },
    checkIn: new Date('2025-09-21T17:00:00Z'),  // 13h00 UTC-4
    checkOut: new Date('2025-09-23T14:00:00Z'), // 10h00 UTC-4
    name: 'Hôtel Tadoussac',
    address: '165 Rue Bord de l\'Eau, Tadoussac, QC G0T 2A0',
    phone: null
  });

  // Safari baleines Zodiac
  await createActivityPlan(tripId, {
    title: { fr: 'Safari baleines Zodiac', en: 'Whale Safari Zodiac' },
    description: { fr: 'Observation des baleines en Zodiac', en: 'Whale watching by Zodiac' },
    startDate: new Date('2025-09-22T13:30:00Z'), // 09h30 UTC-4
    endDate: new Date('2025-09-22T16:00:00Z'),   // 12h00 UTC-4
    name: 'Safari baleines Zodiac',
    location: 'Centre d\'observation, Tadoussac',
    duration: '2h30',
    reservation: 'WHALE-ZDX-TAD2025',
    guide: 'Guide spécialisé'
  });

  // Retour à Montréal
  await createActivityPlan(tripId, {
    title: { fr: 'Retour à Montréal', en: 'Return to Montreal' },
    description: { fr: 'Trajet de retour vers Montréal', en: 'Return journey to Montreal' },
    startDate: new Date('2025-09-23T14:00:00Z'), // 10h00 UTC-4
    endDate: new Date('2025-09-23T20:30:00Z'),   // 16h30 UTC-4
    name: 'Retour à Montréal',
    location: 'Tadoussac → Montréal',
    duration: '6h30',
    reservation: null,
    guide: null
  });

  // Hôtel Montréal (23-25 sept.)
  await createHotelPlan(tripId, {
    title: { fr: 'Hôtel Le Germain', en: 'Hotel Le Germain' },
    description: { fr: 'Derniers jours à Montréal', en: 'Last days in Montreal' },
    checkIn: new Date('2025-09-23T20:30:00Z'),  // 16h30 UTC-4
    checkOut: new Date('2025-09-25T14:00:00Z'), // 10h00 UTC-4
    name: 'Hôtel Le Germain',
    address: '2050 Rue Mansfield, Montréal, QC H3A 1Y9',
    phone: null
  });

  // Retour voiture
  await createActivityPlan(tripId, {
    title: { fr: 'Retour voiture - Montréal', en: 'Car return - Montreal' },
    description: { fr: 'Retour de la voiture à l\'aéroport', en: 'Car return at airport' },
    startDate: new Date('2025-09-25T14:00:00Z'), // 10h00 UTC-4
    endDate: new Date('2025-09-25T15:00:00Z'),   // 11h00 UTC-4
    name: 'Retour voiture',
    location: 'Montréal Aéroport YUL',
    duration: '1h00',
    reservation: null,
    guide: null
  });

  // Vol retour - Montréal à Genève
  await createFlightPlan(tripId, {
    title: { fr: 'Vol LX 87 Montréal → Genève', en: 'Flight LX 87 Montreal → Geneva' },
    description: { fr: 'Vol retour SWISS vers Genève', en: 'SWISS return flight to Geneva' },
    startDate: new Date('2025-09-25T19:15:00Z'), // 15h15 UTC-4
    endDate: new Date('2025-09-26T04:30:00Z'),   // 06h30 UTC+2
    flightNumber: 'LX 87',
    airline: 'SWISS',
    aircraft: 'Airbus A330',
    departure: { code: 'YUL', city: 'Montréal', name: 'Aéroport Montréal-Trudeau' },
    arrival: { code: 'GVA', city: 'Genève', name: 'Aéroport de Genève' },
    confirmation: 'SWISSMTLGVA2025',
    duration: '9h15'
  });

  console.log('✅ Tous les plans ont été créés avec succès !');
}

/**
 * Fonction principale
 */
async function main() {
  try {
    console.log('🚀 Début du chargement du voyage démo Montréal...');
    console.log(`👤 Utilisateur démo: ${DEMO_USER_ID}`);
    
    // Créer le voyage principal
    const tripId = await createMainTrip();
    
    // Charger tous les plans
    await loadAllPlans(tripId);
    
    console.log('🎉 Voyage démo Montréal chargé avec succès !');
    console.log(`📋 ID du voyage: ${tripId}`);
    console.log('💡 Les dates seront recalculées dynamiquement dans l\'application');
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}

module.exports = { main, createMainTrip, loadAllPlans }; 