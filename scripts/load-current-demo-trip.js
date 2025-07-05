// Script Node.js pour charger le voyage démo "En cours Athènes" dans Firestore
// Usage : node scripts/load-current-demo-trip.js

const admin = require('firebase-admin');
const path = require('path');

const DEMO_UID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
const TRIP_ID = '2024-07-05_GVA_ATH';

// Initialisation Firebase Admin
try {
  const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (error) {
  console.error('ERREUR: Le fichier serviceAccountKey.json est introuvable.');
  process.exit(1);
}
const db = admin.firestore();

async function deleteCurrentDemoTrips() {
  const tripsSnap = await db.collection('trips')
    .where('userId', '==', DEMO_UID)
    .where('createdByDemo', '==', true)
    .get();
  let deleted = 0;
  for (const doc of tripsSnap.docs) {
    if (doc.id.includes('ATH') || (doc.data().destination && doc.data().destination.code === 'ATH')) {
      // Supprimer les plans associés
      const plansSnap = await db.collection('trips').doc(doc.id).collection('plans').get();
      for (const plan of plansSnap.docs) {
        await plan.ref.delete();
      }
      await doc.ref.delete();
      deleted++;
      console.log(`[CLEAN] Trip supprimé : ${doc.id}`);
    }
  }
  if (deleted === 0) console.log('Aucun voyage démo "en cours" à supprimer.');
}

async function loadCurrentDemoTrip() {
  // 1. Supprimer les anciens voyages en cours
  await deleteCurrentDemoTrips();

  // 2. Créer le voyage principal
  const tripRef = db.collection('trips').doc(TRIP_ID);
  await tripRef.set({
    id: TRIP_ID,
    userId: DEMO_UID,
    createdByDemo: true,
    startDate: admin.firestore.Timestamp.fromDate(new Date('2024-07-05T07:15:00+02:00')),
    endDate: admin.firestore.Timestamp.fromDate(new Date('2024-07-13T13:00:00+02:00')),
    origin: { code: 'GVA', city: 'Genève', country: 'Suisse' },
    destination: { code: 'ATH', city: 'Athènes', country: 'Grèce' },
    summary: 'Voyage Genève → Athènes du 5 au 13 juillet 2024',
    title: { fr: 'Voyage démo Athènes', en: 'Demo trip Athens' },
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now()
  });
  console.log(`[LOAD] Voyage "En cours Athènes" créé : ${TRIP_ID}`);

  // 3. Créer les plans associés
  const plans = [
    {
      type: 'flight', order: 1, title: 'Vol A3 847 – Aegean Airlines',
      airline: { name: 'Aegean Airlines', iata: 'A3', icao: 'AEE', callsign: 'AEGEAN' },
      flightNumber: '847', callSign: 'AEGEAN847', confirmationNumber: 'A3GVAATH567',
      aircraftType: 'Airbus A320-232',
      departureAirport: { code: 'GVA', name: 'Genève Aéroport', terminal: '1' },
      arrivalAirport: { code: 'ATH', name: "Aéroport d'Athènes", terminal: '1' },
      startTime: '2024-07-05T07:15:00+02:00', endTime: '2024-07-05T10:45:00+03:00', duration: 210, distanceKm: 1940
    },
    {
      type: 'car_rental', order: 2, title: 'Location Europcar – Athènes',
      company: 'Europcar', pickupLocation: 'Terminal 1, ATH Arrivées', pickupTime: '2024-07-05T11:30:00+03:00',
      vehicle: { model: 'Peugeot 2008', transmission: 'automatique' }, reservationId: 'EUROP-ATH2024'
    },
    {
      type: 'hotel', order: 3, title: 'Electra Palace Athens',
      hotelName: 'Electra Palace Athens', address: '18-20 Nikodimou St, Plaka, Athènes 105 57',
      checkIn: '2024-07-05T14:00:00+03:00', checkOut: '2024-07-07T09:00:00+03:00', phone: '+30 210 3370000'
    },
    {
      type: 'activity', order: 4, title: 'Visite Acropole + Musée',
      activityName: 'Visite guidée Acropole & musée', meetingPoint: 'Station Acropolis Metro',
      startTime: '2024-07-06T09:00:00+03:00', endTime: '2024-07-06T13:00:00+03:00', reservationId: 'ACRO-ACT105'
    },
    {
      type: 'ferry', order: 5, title: 'Ferry Blue Star Delos',
      company: 'Blue Star Delos', departurePort: 'Patras', arrivalPort: 'Santorin',
      departureTime: '2024-07-07T14:30:00+03:00', arrivalTime: '2024-07-08T06:30:00+03:00',
      cabin: { type: 'hublot double', occupants: 2 }, reservationId: 'BSF2024-710'
    },
    {
      type: 'hotel', order: 6, title: 'Hotel Aressana Spa & Suites – Fira',
      hotelName: 'Aressana Spa & Suites', address: 'Fira Town, Santorini 847 00, Grèce',
      checkIn: '2024-07-08T08:00:00+03:00', checkOut: '2024-07-11T11:00:00+03:00', phone: '+30 2286 025366'
    },
    {
      type: 'activity', order: 7, title: 'Croisière coucher de soleil + volcan',
      activityName: 'Croisière catamaran, volcan, repas', meetingPoint: 'Port de Vlychada',
      startTime: '2024-07-09T15:00:00+03:00', endTime: '2024-07-09T20:00:00+03:00', reservationId: 'CATASUNSET2024'
    },
    {
      type: 'flight', order: 8, title: 'Vol OA 363 – Olympic Air',
      airline: { name: 'Olympic Air', iata: 'OA', icao: 'OAL', callsign: 'OLYMPIC' },
      flightNumber: '363', callSign: 'OLYMPIC363', confirmationNumber: 'OLY-SJUL-2024',
      aircraftType: 'ATR 42-600',
      departureAirport: { code: 'JTR', name: 'Santorin (JTR)' }, arrivalAirport: { code: 'ATH', name: 'Athènes (ATH)' },
      startTime: '2024-07-11T12:30:00+03:00', endTime: '2024-07-11T13:20:00+03:00', duration: 50
    },
    {
      type: 'hotel', order: 9, title: 'Coco-Mat Hotel Athens',
      hotelName: 'Coco-Mat Hotel Athens', address: '36 Patriarchou Ioakim, Kolonaki, Athènes 106 75',
      checkIn: '2024-07-11T14:00:00+03:00', checkOut: '2024-07-13T10:00:00+03:00'
    },
    {
      type: 'activity', order: 10, title: 'Dîner de fin de voyage – To Thalassino',
      activityName: 'Dîner spécialités poisson', startTime: '2024-07-12T20:00:00+03:00', endTime: '2024-07-12T23:00:00+03:00',
      location: { name: 'To Thalassino', address: 'Akti Koumoundourou 54, Le Pirée 185 33' }
    },
    {
      type: 'flight', order: 11, title: 'Vol A3 846 – Aegean Airlines',
      airline: { name: 'Aegean Airlines', iata: 'A3', icao: 'AEE', callsign: 'AEGEAN' },
      flightNumber: '846', callSign: 'AEGEAN846', confirmationNumber: 'A3ATHGVA852',
      aircraftType: 'Airbus A320-232',
      departureAirport: { code: 'ATH', name: "Athènes (ATH)" }, arrivalAirport: { code: 'GVA', name: 'Genève (GVA)' },
      startTime: '2024-07-13T10:15:00+03:00', endTime: '2024-07-13T13:00:00+02:00', duration: 165
    }
  ];

  const batch = db.batch();
  for (const plan of plans) {
    const planRef = tripRef.collection('plans').doc();
    batch.set(planRef, plan);
  }
  await batch.commit();
  console.log(`[LOAD] ${plans.length} plans créés pour le voyage "En cours Athènes".`);
}

// Lancer la procédure
loadCurrentDemoTrip().then(() => {
  console.log('--- FIN ---');
  process.exit(0);
}).catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
}); 