// Script Node.js pour charger les 3 voyages démo complets selon le cahier des charges
// Usage : node scripts/load-demo-trips-complete.js

const admin = require('firebase-admin');
const path = require('path');

try {
  const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (error) {
  console.error('ERREUR: Le fichier serviceAccountKey.json est introuvable.');
  process.exit(1);
}
const db = admin.firestore();

const DEMO_USER_ID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';

// Fonction utilitaire pour créer des timestamps
function toTimestamp(dateString) {
  return admin.firestore.Timestamp.fromDate(new Date(dateString));
}

// Fonction pour créer un titre multilingue
function createTitle(fr, en) {
  return { fr, en };
}

// Fonction pour créer une description multilingue
function createDescription(fr, en) {
  return { fr, en };
}

async function loadDemoTrips() {
  console.log('🚀 Début du chargement des voyages démo complets...');

  // 1. VOYAGE PASSÉ - MARRAKECH (15-22 avril 2024)
  console.log('\n📅 Création du voyage passé : Marrakech');
  const marrakechTripRef = db.collection('trips').doc();
  await marrakechTripRef.set({
    id: marrakechTripRef.id,
    userId: DEMO_USER_ID,
    title: createTitle('Voyage démo Marrakech', 'Demo trip Marrakech'),
    summary: 'Voyage Genève → Marrakech du 15 au 22 avril 2024 - All inclusive avec excursions',
    startDate: toTimestamp('2024-04-15T09:00:00+02:00'),
    endDate: toTimestamp('2024-04-22T13:45:00+02:00'),
    origin: { code: 'GVA', city: 'Genève', country: 'Suisse' },
    destination: { code: 'RAK', city: 'Marrakech', country: 'Maroc' },
    type: 'vacation',
    currency: 'EUR',
    totalBudget: 2500,
    createdByDemo: true,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    status: 'past'
  });

  // Plans du voyage Marrakech
  const marrakechPlans = [
    {
      title: createTitle('Vol Genève → Marrakech', 'Flight Geneva → Marrakech'),
      description: createDescription('Vol AT 941 - Royal Air Maroc', 'Flight AT 941 - Royal Air Maroc'),
      type: 'flight',
      startDate: toTimestamp('2024-04-15T09:00:00+02:00'),
      endDate: toTimestamp('2024-04-15T11:30:00+01:00'),
      details: {
        flight: {
          flight_number: 'AT 941',
          airline: 'Royal Air Maroc',
          departure: { airport: 'Genève Aéroport (GVA)', terminal: '1' },
          arrival: { airport: 'Marrakech Menara (RAK)', terminal: '1' },
          confirmation: 'RAM0415GVA',
          seat: '12A'
        }
      }
    },
    {
      title: createTitle('Transfert Aéroport → Hôtel', 'Airport → Hotel Transfer'),
      description: createDescription('Chauffeur privé Rachid - Mercedes Vito', 'Private driver Rachid - Mercedes Vito'),
      type: 'activity',
      startDate: toTimestamp('2024-04-15T12:00:00+01:00'),
      endDate: toTimestamp('2024-04-15T13:00:00+01:00'),
      details: {
        transfer: {
          company: 'Atlas Experience',
          driver: 'Rachid',
          vehicle: 'Mercedes Vito climatisé',
          contact: '+212 6 01 02 03 04'
        }
      }
    },
    {
      title: createTitle('Hôtel Riu Tikida Palmeraie', 'Hotel Riu Tikida Palmeraie'),
      description: createDescription('All Inclusive - Route Fès, Km 6', 'All Inclusive - Route Fès, Km 6'),
      type: 'hotel',
      startDate: toTimestamp('2024-04-15T13:00:00+01:00'),
      endDate: toTimestamp('2024-04-22T11:00:00+01:00'),
      details: {
        hotel: {
          name: 'Riu Tikida Palmeraie Marrakech',
          address: 'Route Fès, Km 6, Marrakech 40000',
          phone: '+212 5 24 30 30 30',
          room_type: 'Chambre standard',
          board: 'All Inclusive'
        }
      }
    },
    {
      title: createTitle('Visite historique de Marrakech', 'Historical visit of Marrakech'),
      description: createDescription('Guide privé Khalid - Palais, Médersa, Souks', 'Private guide Khalid - Palaces, Medersa, Souks'),
      type: 'activity',
      startDate: toTimestamp('2024-04-16T09:00:00+01:00'),
      endDate: toTimestamp('2024-04-16T17:00:00+01:00'),
      details: {
        activity: {
          guide: 'Khalid',
          sites: ['Palais de la Bahia', 'Médersa Ben Youssef', 'Mosquée Koutoubia', 'Souks de la médina'],
          lunch: 'Terrasse des Épices',
          reference: 'PRIV-HISTO-MAR04'
        }
      }
    },
    {
      title: createTitle('Vallée de l\'Ourika', 'Ourika Valley'),
      description: createDescription('Randonnée cascades + déjeuner berbère', 'Hiking waterfalls + Berber lunch'),
      type: 'activity',
      startDate: toTimestamp('2024-04-17T08:00:00+01:00'),
      endDate: toTimestamp('2024-04-17T17:30:00+01:00'),
      details: {
        activity: {
          transport: '4x4 privé avec chauffeur Abderrahim',
          activity: 'Randonnée douce 1h dans les cascades de Setti-Fatma',
          lunch: 'Déjeuner au bord de l\'oued dans une maison berbère',
          reference: 'PRIV-OURIKA-J17'
        }
      }
    },
    {
      title: createTitle('Journée détente hôtel', 'Hotel relaxation day'),
      description: createDescription('Hammam, spa, piscine, animation musicale', 'Hammam, spa, pool, musical entertainment'),
      type: 'activity',
      startDate: toTimestamp('2024-04-18T09:00:00+01:00'),
      endDate: toTimestamp('2024-04-18T22:00:00+01:00'),
      details: {
        activity: {
          activities: ['Hammam & soins spa', 'Cocktail piscine', 'Animation musicale marocaine'],
          included: true
        }
      }
    },
    {
      title: createTitle('Désert d\'Agafay - Sunset & Dîner', 'Agafay Desert - Sunset & Dinner'),
      description: createDescription('Balade dromadaire + dîner tajine sous tente', 'Camel ride + tajine dinner under tent'),
      type: 'activity',
      startDate: toTimestamp('2024-04-19T15:00:00+01:00'),
      endDate: toTimestamp('2024-04-19T22:30:00+01:00'),
      details: {
        activity: {
          activities: ['Balade en dromadaire (30 min)', 'Apéritif vue désert', 'Dîner tajine sous tente caïdale'],
          entertainment: 'Musique gnawa live',
          reference: 'AGAFAY-EVENING-RIU'
        }
      }
    },
    {
      title: createTitle('Jardin Majorelle & Musée YSL', 'Majorelle Garden & YSL Museum'),
      description: createDescription('Visite privée avec entrées coupe-file', 'Private visit with skip-the-line tickets'),
      type: 'activity',
      startDate: toTimestamp('2024-04-20T10:00:00+01:00'),
      endDate: toTimestamp('2024-04-20T13:30:00+01:00'),
      details: {
        activity: {
          sites: ['Jardin Majorelle', 'Musée Yves Saint Laurent'],
          included: 'Entrées coupe-file, thé à la Villa Oasis',
          reference: 'MJYSL-VIPM'
        }
      }
    },
    {
      title: createTitle('Shopping guidé médina', 'Guided shopping medina'),
      description: createDescription('Accompagnement personnalisé dans les souks', 'Personalized accompaniment in souks'),
      type: 'activity',
      startDate: toTimestamp('2024-04-21T10:30:00+01:00'),
      endDate: toTimestamp('2024-04-21T15:00:00+01:00'),
      details: {
        activity: {
          shopping: ['Artisanat', 'Cuir', 'Épices', 'Objets déco'],
          reference: 'SHOP-MEDINA-GUIDE'
        }
      }
    },
    {
      title: createTitle('Transfert Hôtel → Aéroport', 'Hotel → Airport Transfer'),
      description: createDescription('Départ hôtel 08h00 - Assistance bagages', 'Hotel departure 08h00 - Baggage assistance'),
      type: 'activity',
      startDate: toTimestamp('2024-04-22T08:00:00+01:00'),
      endDate: toTimestamp('2024-04-22T08:45:00+01:00'),
      details: {
        transfer: {
          company: 'Atlas Experience',
          assistance: 'Assistance bagages incluse'
        }
      }
    },
    {
      title: createTitle('Vol Marrakech → Genève', 'Flight Marrakech → Geneva'),
      description: createDescription('Vol AT 940 - Royal Air Maroc', 'Flight AT 940 - Royal Air Maroc'),
      type: 'flight',
      startDate: toTimestamp('2024-04-22T10:30:00+01:00'),
      endDate: toTimestamp('2024-04-22T13:45:00+02:00'),
      details: {
        flight: {
          flight_number: 'AT 940',
          airline: 'Royal Air Maroc',
          departure: { airport: 'Marrakech Menara (RAK)', terminal: '1' },
          arrival: { airport: 'Genève Aéroport (GVA)', terminal: '1' },
          confirmation: 'RAM0422RAK',
          seat: '12A'
        }
      }
    }
  ];

  // Créer les plans Marrakech
  const marrakechBatch = db.batch();
  for (const plan of marrakechPlans) {
    const planRef = db.collection('plans').doc();
    marrakechBatch.set(planRef, {
      id: planRef.id,
      tripId: marrakechTripRef.id,
      userId: DEMO_USER_ID,
      ...plan,
      createdByDemo: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
  }
  await marrakechBatch.commit();
  console.log(`✅ Voyage Marrakech créé avec ${marrakechPlans.length} plans`);

  // 2. VOYAGE EN COURS - ATHÈNES (5-13 juillet 2024)
  console.log('\n📅 Création du voyage en cours : Athènes');
  const athensTripRef = db.collection('trips').doc();
  await athensTripRef.set({
    id: athensTripRef.id,
    userId: DEMO_USER_ID,
    title: createTitle('Voyage démo Athènes', 'Demo trip Athens'),
    summary: 'Voyage Genève → Athènes du 5 au 13 juillet 2024 - Culture + Santorin',
    startDate: toTimestamp('2024-07-05T07:15:00+02:00'),
    endDate: toTimestamp('2024-07-13T13:00:00+02:00'),
    origin: { code: 'GVA', city: 'Genève', country: 'Suisse' },
    destination: { code: 'ATH', city: 'Athènes', country: 'Grèce' },
    type: 'vacation',
    currency: 'EUR',
    totalBudget: 1800,
    createdByDemo: true,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    status: 'ongoing'
  });

  // Plans du voyage Athènes
  const athensPlans = [
    {
      title: createTitle('Vol Genève → Athènes', 'Flight Geneva → Athens'),
      description: createDescription('Vol A3 847 - Aegean Airlines', 'Flight A3 847 - Aegean Airlines'),
      type: 'flight',
      startDate: toTimestamp('2024-07-05T07:15:00+02:00'),
      endDate: toTimestamp('2024-07-05T10:45:00+03:00'),
      details: {
        flight: {
          flight_number: 'A3 847',
          airline: 'Aegean Airlines',
          departure: { airport: 'Genève Aéroport (GVA)' },
          arrival: { airport: 'Aéroport International d\'Athènes (ATH)' },
          confirmation: 'A3GVAATH567'
        }
      }
    },
    {
      title: createTitle('Location voiture Athènes', 'Car rental Athens'),
      description: createDescription('Europcar - Peugeot 2008 automatique', 'Europcar - Peugeot 2008 automatic'),
      type: 'car_rental',
      startDate: toTimestamp('2024-07-05T11:30:00+03:00'),
      endDate: toTimestamp('2024-07-13T10:00:00+03:00'),
      details: {
        car_rental: {
          company: 'Europcar',
          location: 'ATH Arrivées Terminal 1',
          address: 'Eleftherios Venizelos Airport, Spata 190 04, Grèce',
          model: 'Peugeot 2008 automatique',
          reference: 'EUROP-ATH2024'
        }
      }
    },
    {
      title: createTitle('Hôtel Electra Palace Athens', 'Hotel Electra Palace Athens'),
      description: createDescription('5-7 juillet - Plaka', 'July 5-7 - Plaka'),
      type: 'hotel',
      startDate: toTimestamp('2024-07-05T14:00:00+03:00'),
      endDate: toTimestamp('2024-07-07T09:00:00+03:00'),
      details: {
        hotel: {
          name: 'Electra Palace Athens',
          address: '18-20 N Nikodimou St, Plaka, Athènes 105 57',
          phone: '+30 210 3370000'
        }
      }
    },
    {
      title: createTitle('Visite Acropole + musée', 'Acropolis + museum visit'),
      description: createDescription('Guide local officiel - Entrée incluse', 'Official local guide - Entry included'),
      type: 'activity',
      startDate: toTimestamp('2024-07-06T09:00:00+03:00'),
      endDate: toTimestamp('2024-07-06T13:00:00+03:00'),
      details: {
        activity: {
          meeting_point: 'Station Acropolis Metro',
          guide: 'Guide local officiel',
          reference: 'ACRO-ACT105'
        }
      }
    },
    {
      title: createTitle('Route Athènes → Patras', 'Route Athens → Patras'),
      description: createDescription('Via Corinth - Pause canal de Corinthe', 'Via Corinth - Corinth Canal stop'),
      type: 'activity',
      startDate: toTimestamp('2024-07-07T09:00:00+03:00'),
      endDate: toTimestamp('2024-07-07T12:00:00+03:00'),
      details: {
        transport: {
          route: 'Athènes → Patras via Corinth',
          duration: '2h30',
          stops: ['Canal de Corinthe (10h30)']
        }
      }
    },
    {
      title: createTitle('Traversée Patras → Santorin', 'Ferry Patras → Santorini'),
      description: createDescription('Blue Star Ferries - Cabine avec hublot', 'Blue Star Ferries - Cabin with porthole'),
      type: 'activity',
      startDate: toTimestamp('2024-07-07T14:30:00+03:00'),
      endDate: toTimestamp('2024-07-08T06:30:00+03:00'),
      details: {
        ferry: {
          company: 'Blue Star Ferries',
          ship: 'Blue Star Delos',
          cabin: 'Cabine avec hublot - 2 pers.',
          reference: 'BSF2024-710'
        }
      }
    },
    {
      title: createTitle('Hôtel Aressana Santorin', 'Hotel Aressana Santorini'),
      description: createDescription('8-11 juillet - Fira', 'July 8-11 - Fira'),
      type: 'hotel',
      startDate: toTimestamp('2024-07-08T08:00:00+03:00'),
      endDate: toTimestamp('2024-07-11T11:00:00+03:00'),
      details: {
        hotel: {
          name: 'Hotel Aressana Spa & Suites',
          address: 'Fira Town, Santorini 847 00, Grèce',
          phone: '+30 2286 025366',
          check_in: 'Early check-in confirmé'
        }
      }
    },
    {
      title: createTitle('Croisière coucher de soleil', 'Sunset cruise'),
      description: createDescription('Catamaran + volcan - Repas inclus', 'Catamaran + volcano - Meals included'),
      type: 'activity',
      startDate: toTimestamp('2024-07-09T15:00:00+03:00'),
      endDate: toTimestamp('2024-07-09T20:00:00+03:00'),
      details: {
        activity: {
          departure: 'Port de Vlychada',
          boat: 'Catamaran',
          included: 'Repas & boissons',
          reference: 'CATASUNSET2024'
        }
      }
    },
    {
      title: createTitle('Vol Santorin → Athènes', 'Flight Santorini → Athens'),
      description: createDescription('Vol OA 363 - Olympic Air', 'Flight OA 363 - Olympic Air'),
      type: 'flight',
      startDate: toTimestamp('2024-07-11T12:30:00+03:00'),
      endDate: toTimestamp('2024-07-11T13:20:00+03:00'),
      details: {
        flight: {
          flight_number: 'OA 363',
          airline: 'Olympic Air',
          departure: { airport: 'Santorin (JTR)' },
          arrival: { airport: 'Athènes (ATH)' },
          reference: 'OLY-SJUL-2024'
        }
      }
    },
    {
      title: createTitle('Hôtel Coco-Mat Athens', 'Hotel Coco-Mat Athens'),
      description: createDescription('11-13 juillet - Kolonaki', 'July 11-13 - Kolonaki'),
      type: 'hotel',
      startDate: toTimestamp('2024-07-11T14:00:00+03:00'),
      endDate: toTimestamp('2024-07-13T10:00:00+03:00'),
      details: {
        hotel: {
          name: 'Coco-Mat Hotel Athens',
          address: '36 Patriarchou Ioakim, Kolonaki, Athènes 106 75'
        }
      }
    },
    {
      title: createTitle('Dîner To Thalassino', 'Dinner To Thalassino'),
      description: createDescription('Spécialités poisson grillé + ouzo', 'Grilled fish specialties + ouzo'),
      type: 'activity',
      startDate: toTimestamp('2024-07-12T20:00:00+03:00'),
      endDate: toTimestamp('2024-07-12T22:00:00+03:00'),
      details: {
        restaurant: {
          name: 'To Thalassino',
          address: 'Akti Koumoundourou 54, Le Pirée 185 33',
          specialties: ['Poisson grillé', 'Ouzo']
        }
      }
    },
    {
      title: createTitle('Vol Athènes → Genève', 'Flight Athens → Geneva'),
      description: createDescription('Vol A3 846 - Aegean Airlines', 'Flight A3 846 - Aegean Airlines'),
      type: 'flight',
      startDate: toTimestamp('2024-07-13T10:15:00+03:00'),
      endDate: toTimestamp('2024-07-13T13:00:00+02:00'),
      details: {
        flight: {
          flight_number: 'A3 846',
          airline: 'Aegean Airlines',
          departure: { airport: 'Aéroport International d\'Athènes (ATH)' },
          arrival: { airport: 'Genève Aéroport (GVA)' },
          confirmation: 'A3ATHGVA852'
        }
      }
    }
  ];

  // Créer les plans Athènes
  const athensBatch = db.batch();
  for (const plan of athensPlans) {
    const planRef = db.collection('plans').doc();
    athensBatch.set(planRef, {
      id: planRef.id,
      tripId: athensTripRef.id,
      userId: DEMO_USER_ID,
      ...plan,
      createdByDemo: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
  }
  await athensBatch.commit();
  console.log(`✅ Voyage Athènes créé avec ${athensPlans.length} plans`);

  // 3. VOYAGE FUTUR - MONTRÉAL (10-25 septembre 2025)
  console.log('\n📅 Création du voyage futur : Montréal');
  const montrealTripRef = db.collection('trips').doc();
  await montrealTripRef.set({
    id: montrealTripRef.id,
    userId: DEMO_USER_ID,
    title: createTitle('Voyage démo Montréal', 'Demo trip Montreal'),
    summary: 'Genève → Montréal / Road Trip Québec 15 jours - 10 au 25 septembre 2025',
    startDate: toTimestamp('2025-09-10T10:40:00+02:00'),
    endDate: toTimestamp('2025-09-26T06:30:00+02:00'),
    origin: { code: 'GVA', city: 'Genève', country: 'Suisse' },
    destination: { code: 'YUL', city: 'Montréal', country: 'Canada' },
    type: 'road_trip',
    currency: 'CAD',
    totalBudget: 3500,
    createdByDemo: true,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    status: 'upcoming'
  });

  // Plans du voyage Montréal
  const montrealPlans = [
    {
      title: createTitle('Vol Genève → Montréal', 'Flight Geneva → Montreal'),
      description: createDescription('Vol U2 5129 - EasyJet', 'Flight U2 5129 - EasyJet'),
      type: 'flight',
      startDate: toTimestamp('2025-09-10T10:40:00+02:00'),
      endDate: toTimestamp('2025-09-10T13:00:00-04:00'),
      details: {
        flight: {
          flight_number: 'U2 5129',
          airline: 'EasyJet',
          departure: { airport: 'Genève Aéroport (GVA)' },
          arrival: { airport: 'Montréal-Trudeau (YUL)' },
          confirmation: 'EZK52P9',
          duration: '8h20'
        }
      }
    },
    {
      title: createTitle('Location voiture Montréal', 'Car rental Montreal'),
      description: createDescription('Avis - Toyota RAV4 automatique', 'Avis - Toyota RAV4 automatic'),
      type: 'car_rental',
      startDate: toTimestamp('2025-09-10T13:30:00-04:00'),
      endDate: toTimestamp('2025-09-25T10:00:00-04:00'),
      details: {
        car_rental: {
          company: 'Avis',
          location: 'Montréal Aéroport YUL',
          address: '975 Blvd. Roméo-Vachon N, Dorval, QC H4Y 1H1',
          model: 'Toyota RAV4 automatique',
          reference: 'MONTREAL2025AVIS'
        }
      }
    },
    {
      title: createTitle('Hôtel Bonaventure Montréal', 'Hotel Bonaventure Montreal'),
      description: createDescription('10-12 septembre - Centre-ville', 'September 10-12 - Downtown'),
      type: 'hotel',
      startDate: toTimestamp('2025-09-10T15:00:00-04:00'),
      endDate: toTimestamp('2025-09-12T11:00:00-04:00'),
      details: {
        hotel: {
          name: 'Hôtel Bonaventure Montréal',
          address: '900 Rue de la Gauchetière O, Montréal, QC H5A 1E4',
          phone: '+1 514-878-2332'
        }
      }
    },
    {
      title: createTitle('Vieux-Montréal & Mont Royal', 'Old Montreal & Mount Royal'),
      description: createDescription('Visite guidée historique + montée Mont Royal', 'Historical guided tour + Mount Royal climb'),
      type: 'activity',
      startDate: toTimestamp('2025-09-11T09:00:00-04:00'),
      endDate: toTimestamp('2025-09-11T12:30:00-04:00'),
      details: {
        activity: {
          meeting_point: 'Place d\'Armes, Vieux-Montréal',
          guide: 'Guide en français',
          reference: 'HISTO-VMX21'
        }
      }
    },
    {
      title: createTitle('Route Montréal → Québec', 'Route Montreal → Quebec'),
      description: createDescription('260 km - 3h30 de route', '260 km - 3h30 drive'),
      type: 'activity',
      startDate: toTimestamp('2025-09-12T11:00:00-04:00'),
      endDate: toTimestamp('2025-09-12T14:30:00-04:00'),
      details: {
        transport: {
          route: 'Montréal → Québec City',
          distance: '260 km',
          duration: '3h30'
        }
      }
    },
    {
      title: createTitle('Auberge Saint-Antoine Québec', 'Auberge Saint-Antoine Quebec'),
      description: createDescription('12-15 septembre - Vieux-Québec', 'September 12-15 - Old Quebec'),
      type: 'hotel',
      startDate: toTimestamp('2025-09-12T15:00:00-04:00'),
      endDate: toTimestamp('2025-09-15T10:30:00-04:00'),
      details: {
        hotel: {
          name: 'Auberge Saint-Antoine',
          address: '8 Rue Saint-Antoine, Vieux-Québec, QC G1K 4C9'
        }
      }
    },
    {
      title: createTitle('Chute Montmorency + Croisière', 'Montmorency Falls + Cruise'),
      description: createDescription('Téléphérique + croisière 1h30', 'Cable car + 1h30 cruise'),
      type: 'activity',
      startDate: toTimestamp('2025-09-13T09:00:00-04:00'),
      endDate: toTimestamp('2025-09-13T13:00:00-04:00'),
      details: {
        activity: {
          departure: 'Quai de Québec',
          included: 'Téléphérique, croisière 1h30',
          guide: 'Guide bilingue',
          reference: 'CROQ2025'
        }
      }
    },
    {
      title: createTitle('Vol Québec → Gaspé', 'Flight Quebec → Gaspé'),
      description: createDescription('Vol AC8832 - Air Canada', 'Flight AC8832 - Air Canada'),
      type: 'flight',
      startDate: toTimestamp('2025-09-15T09:30:00-04:00'),
      endDate: toTimestamp('2025-09-15T10:45:00-04:00'),
      details: {
        flight: {
          flight_number: 'AC8832',
          airline: 'Air Canada',
          departure: { airport: 'Québec YQB' },
          arrival: { airport: 'Gaspé YGP' },
          reference: 'INT-YQB-GSP-SEP'
        }
      }
    },
    {
      title: createTitle('Location voiture Gaspé', 'Car rental Gaspé'),
      description: createDescription('Budget - 15 au 18 septembre', 'Budget - September 15-18'),
      type: 'car_rental',
      startDate: toTimestamp('2025-09-15T11:00:00-04:00'),
      endDate: toTimestamp('2025-09-18T10:00:00-04:00'),
      details: {
        car_rental: {
          company: 'Budget',
          address: '75 Rue de l\'Aéroport, Gaspé, QC G4X 2K1'
        }
      }
    },
    {
      title: createTitle('Hôtel Baker Gaspé', 'Hotel Baker Gaspé'),
      description: createDescription('15-18 septembre', 'September 15-18'),
      type: 'hotel',
      startDate: toTimestamp('2025-09-15T13:30:00-04:00'),
      endDate: toTimestamp('2025-09-18T10:00:00-04:00'),
      details: {
        hotel: {
          name: 'Hôtel Baker Gaspé',
          address: '178 Rue de la Reine, Gaspé, QC G4X 1T6'
        }
      }
    },
    {
      title: createTitle('Parc Forillon + Baleines', 'Forillon Park + Whales'),
      description: createDescription('Zodiac observation baleines & phoques', 'Zodiac whale & seal watching'),
      type: 'activity',
      startDate: toTimestamp('2025-09-16T08:00:00-04:00'),
      endDate: toTimestamp('2025-09-16T12:30:00-04:00'),
      details: {
        activity: {
          location: 'Cap-des-Rosiers, Forillon',
          boat: 'Zodiac',
          activity: 'Observation baleines & phoques',
          reference: 'BALEINE-FR88'
        }
      }
    },
    {
      title: createTitle('Route Gaspé → Percé', 'Route Gaspé → Percé'),
      description: createDescription('1h30 de route', '1h30 drive'),
      type: 'activity',
      startDate: toTimestamp('2025-09-18T10:00:00-04:00'),
      endDate: toTimestamp('2025-09-18T11:30:00-04:00'),
      details: {
        transport: {
          route: 'Gaspé → Percé',
          duration: '1h30'
        }
      }
    },
    {
      title: createTitle('Hôtel Riôtel Percé', 'Hotel Riôtel Percé'),
      description: createDescription('18-20 septembre', 'September 18-20'),
      type: 'hotel',
      startDate: toTimestamp('2025-09-18T12:00:00-04:00'),
      endDate: toTimestamp('2025-09-20T08:00:00-04:00'),
      details: {
        hotel: {
          name: 'Hôtel Riôtel Percé',
          address: '261 Route 132, Percé, QC G0C 2L0'
        }
      }
    },
    {
      title: createTitle('Rocher Percé + Île Bonaventure', 'Percé Rock + Bonaventure Island'),
      description: createDescription('Bateau + randonnée libre', 'Boat + free hiking'),
      type: 'activity',
      startDate: toTimestamp('2025-09-19T09:00:00-04:00'),
      endDate: toTimestamp('2025-09-19T14:00:00-04:00'),
      details: {
        activity: {
          activities: ['Bateau', 'Randonnée libre'],
          reference: 'ILEBONAV2025'
        }
      }
    },
    {
      title: createTitle('Route Percé → Rimouski', 'Route Percé → Rimouski'),
      description: createDescription('5h30 de route - Pause déjeuner Matane', '5h30 drive - Lunch stop Matane'),
      type: 'activity',
      startDate: toTimestamp('2025-09-20T08:00:00-04:00'),
      endDate: toTimestamp('2025-09-20T15:00:00-04:00'),
      details: {
        transport: {
          route: 'Percé → Rimouski',
          duration: '5h30',
          stops: ['Pause déjeuner à Matane']
        }
      }
    },
    {
      title: createTitle('Hôtel Rimouski', 'Hotel Rimouski'),
      description: createDescription('20-21 septembre', 'September 20-21'),
      type: 'hotel',
      startDate: toTimestamp('2025-09-20T15:00:00-04:00'),
      endDate: toTimestamp('2025-09-21T10:00:00-04:00'),
      details: {
        hotel: {
          name: 'Hôtel Rimouski',
          address: '225 Blvd René-Lepage E, Rimouski, QC G5L 1P2'
        }
      }
    },
    {
      title: createTitle('Sous-marin Onondaga + Phare', 'Onondaga Submarine + Lighthouse'),
      description: createDescription('Pointe-au-Père - Audio-guide FR/EN', 'Pointe-au-Père - Audio-guide FR/EN'),
      type: 'activity',
      startDate: toTimestamp('2025-09-20T17:00:00-04:00'),
      endDate: toTimestamp('2025-09-20T19:00:00-04:00'),
      details: {
        activity: {
          location: 'Pointe-au-Père',
          included: 'Audio-guide FR/EN'
        }
      }
    },
    {
      title: createTitle('Ferry Rimouski → Tadoussac', 'Ferry Rimouski → Tadoussac'),
      description: createDescription('Via Baie-Comeau - 2h traversée', 'Via Baie-Comeau - 2h crossing'),
      type: 'activity',
      startDate: toTimestamp('2025-09-21T11:00:00-04:00'),
      endDate: toTimestamp('2025-09-21T13:00:00-04:00'),
      details: {
        ferry: {
          route: 'Rimouski → Tadoussac via Baie-Comeau',
          duration: '2h traversée'
        }
      }
    },
    {
      title: createTitle('Hôtel Tadoussac', 'Hotel Tadoussac'),
      description: createDescription('21-23 septembre', 'September 21-23'),
      type: 'hotel',
      startDate: toTimestamp('2025-09-21T13:00:00-04:00'),
      endDate: toTimestamp('2025-09-23T10:00:00-04:00'),
      details: {
        hotel: {
          name: 'Hôtel Tadoussac',
          address: '165 Rue Bord de l\'Eau, Tadoussac, QC G0T 2A0'
        }
      }
    },
    {
      title: createTitle('Safari baleines Zodiac', 'Whale Safari Zodiac'),
      description: createDescription('Centre d\'observation Tadoussac', 'Tadoussac observation center'),
      type: 'activity',
      startDate: toTimestamp('2025-09-22T09:30:00-04:00'),
      endDate: toTimestamp('2025-09-22T12:00:00-04:00'),
      details: {
        activity: {
          location: 'Centre d\'observation, Tadoussac',
          boat: 'Zodiac',
          reference: 'WHALE-ZDX-TAD2025'
        }
      }
    },
    {
      title: createTitle('Route Tadoussac → Montréal', 'Route Tadoussac → Montreal'),
      description: createDescription('6h de route - Retour', '6h drive - Return'),
      type: 'activity',
      startDate: toTimestamp('2025-09-23T10:00:00-04:00'),
      endDate: toTimestamp('2025-09-23T16:30:00-04:00'),
      details: {
        transport: {
          route: 'Tadoussac → Montréal',
          duration: '6h de route'
        }
      }
    },
    {
      title: createTitle('Hôtel Le Germain Montréal', 'Hotel Le Germain Montreal'),
      description: createTitle('23-25 septembre - Derniers jours', 'September 23-25 - Last days'),
      type: 'hotel',
      startDate: toTimestamp('2025-09-23T16:30:00-04:00'),
      endDate: toTimestamp('2025-09-25T10:00:00-04:00'),
      details: {
        hotel: {
          name: 'Hôtel Le Germain',
          address: '2050 Rue Mansfield, Montréal, QC H3A 1Y9'
        }
      }
    },
    {
      title: createTitle('Retour voiture Montréal', 'Car return Montreal'),
      description: createDescription('Aéroport Montréal - 10h00', 'Montreal Airport - 10h00'),
      type: 'activity',
      startDate: toTimestamp('2025-09-25T10:00:00-04:00'),
      endDate: toTimestamp('2025-09-25T10:30:00-04:00'),
      details: {
        car_return: {
          location: 'Montréal Aéroport',
          time: '10h00'
        }
      }
    },
    {
      title: createTitle('Vol Montréal → Genève', 'Flight Montreal → Geneva'),
      description: createDescription('Vol LX 87 - SWISS', 'Flight LX 87 - SWISS'),
      type: 'flight',
      startDate: toTimestamp('2025-09-25T15:15:00-04:00'),
      endDate: toTimestamp('2025-09-26T06:30:00+02:00'),
      details: {
        flight: {
          flight_number: 'LX 87',
          airline: 'SWISS',
          departure: { airport: 'Montréal-Trudeau (YUL)' },
          arrival: { airport: 'Genève Aéroport (GVA)' },
          reference: 'SWISSMTLGVA2025'
        }
      }
    }
  ];

  // Créer les plans Montréal
  const montrealBatch = db.batch();
  for (const plan of montrealPlans) {
    const planRef = db.collection('plans').doc();
    montrealBatch.set(planRef, {
      id: planRef.id,
      tripId: montrealTripRef.id,
      userId: DEMO_USER_ID,
      ...plan,
      createdByDemo: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
  }
  await montrealBatch.commit();
  console.log(`✅ Voyage Montréal créé avec ${montrealPlans.length} plans`);

  console.log('\n🎉 CHARGEMENT TERMINÉ AVEC SUCCÈS !');
  console.log('📊 RÉSUMÉ :');
  console.log(`   • Voyage passé (Marrakech) : ${marrakechPlans.length} plans`);
  console.log(`   • Voyage en cours (Athènes) : ${athensPlans.length} plans`);
  console.log(`   • Voyage futur (Montréal) : ${montrealPlans.length} plans`);
  console.log(`   • Total : ${marrakechPlans.length + athensPlans.length + montrealPlans.length} plans`);
}

loadDemoTrips().catch(err => {
  console.error('❌ Erreur lors du chargement :', err);
  process.exit(1);
}); 