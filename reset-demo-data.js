// Script Node.js pour purger et reseeder les données démo
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // À placer dans le dossier racine

const DEMO_UID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Copie directe de la fonction getDemoData (version JS)
function getDemoData(lang = 'fr') {
  const now = new Date();
  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };
  const user = {
    uid: 'guest-demo',
    email: 'guest@bob-demo.com',
    firstName: { fr: 'Invité', en: 'Guest' },
    lastName: { fr: 'Démo', en: 'Demo' },
    preferredLang: lang,
    createdAt: new Date('2023-01-01T10:00:00Z').toISOString(),
    lastLogin: now.toISOString()
  };
  const pastStart = addDays(now, -15);
  const pastEnd = addDays(now, -10);
  const ongoingStart = addDays(now, -2);
  const ongoingEnd = addDays(now, 3);
  const futureStart = addDays(now, 10);
  const futureEnd = addDays(now, 15);
  const trips = [
    {
      id: 'trip-past',
      title: { fr: 'Voyage passé à Barcelone', en: 'Past trip to Barcelona' },
      startDate: pastStart.toISOString(),
      endDate: pastEnd.toISOString(),
      plans: [
        {
          id: 'plan1',
          type: 'flight',
          title: { fr: 'Vol Paris → Barcelone', en: 'Flight Paris → Barcelona' },
          startDate: addDays(pastStart, 0).toISOString(),
          endDate: addDays(pastStart, 0).toISOString(),
          details: { from: 'Paris', to: 'Barcelone', company: 'Air France', callsign: '' }
        },
        {
          id: 'plan2',
          type: 'hotel',
          title: { fr: 'Hôtel Ramblas', en: 'Ramblas Hotel' },
          startDate: addDays(pastStart, 0).toISOString(),
          endDate: addDays(pastEnd, 0).toISOString(),
          details: { address: 'La Rambla, Barcelone' }
        }
      ]
    },
    {
      id: 'trip-ongoing',
      title: { fr: 'Voyage en cours à Rome', en: 'Ongoing trip in Rome' },
      startDate: ongoingStart.toISOString(),
      endDate: ongoingEnd.toISOString(),
      plans: [
        {
          id: 'plan3',
          type: 'flight',
          title: { fr: 'Vol Genève → Rome', en: 'Flight Geneva → Rome' },
          startDate: addDays(ongoingStart, 0).toISOString(),
          endDate: addDays(ongoingStart, 0).toISOString(),
          details: { from: 'Genève', to: 'Rome', company: 'EasyJet', callsign: '' }
        },
        {
          id: 'plan4',
          type: 'activity',
          title: { fr: 'Visite du Colisée', en: 'Colosseum visit' },
          startDate: addDays(ongoingStart, 1).toISOString(),
          endDate: addDays(ongoingStart, 1).toISOString(),
          details: { location: 'Colisée' }
        }
      ]
    },
    {
      id: 'trip-future',
      title: { fr: 'Voyage à venir à Montréal', en: 'Upcoming trip to Montreal' },
      startDate: futureStart.toISOString(),
      endDate: futureEnd.toISOString(),
      plans: [
        {
          id: 'plan5',
          type: 'flight',
          title: { fr: 'Vol Lyon → Montréal', en: 'Flight Lyon → Montreal' },
          startDate: addDays(futureStart, 0).toISOString(),
          endDate: addDays(futureStart, 0).toISOString(),
          details: { from: 'Lyon', to: 'Montréal', company: 'Air Canada', callsign: '' }
        },
        {
          id: 'plan6',
          type: 'hotel',
          title: { fr: 'Hôtel Vieux-Montréal', en: 'Old Montreal Hotel' },
          startDate: addDays(futureStart, 0).toISOString(),
          endDate: addDays(futureEnd, 0).toISOString(),
          details: { address: 'Rue Saint-Paul, Montréal' }
        }
      ]
    }
  ];
  return { user, trips };
}

async function clearDemoData() {
  const collections = ['plans', 'trips'];
  for (const coll of collections) {
    const snap = await db.collection(coll)
      .where('userId', '==', DEMO_UID)
      .where('createdByDemo', '==', true)
      .get();
    for (const doc of snap.docs) {
      await doc.ref.delete();
      console.log(`[RESET] ${coll} supprimé : ${doc.id}`);
    }
  }
}

function generateCallsign(from, to) {
  const airline = ['AF', 'EZ', 'AC', 'LX', 'BA', 'LH', 'KL', 'UA', 'DL', 'AA'][Math.floor(Math.random()*10)];
  const num = Math.floor(100 + Math.random()*900);
  let suffix = '';
  if (from && to) suffix = '-' + from.substring(0,2).toUpperCase() + to.substring(0,2).toUpperCase();
  return `${airline}${num}${suffix}`;
}

async function seedDemoData() {
  const demoData = getDemoData('fr');
  for (const trip of demoData.trips) {
    if (!trip.plans) continue;
    // Créer les plans
    for (const plan of trip.plans) {
      if (plan.type === 'flight' && plan.details && plan.details.from && plan.details.to && plan.details.company) {
        plan.details.callsign = generateCallsign(plan.details.from, plan.details.to);
      }
      const planRef = db.collection('plans').doc();
      await planRef.set({
        ...plan,
        id: planRef.id,
        userId: DEMO_UID,
        createdByDemo: true,
        tripId: trip.id
      });
      plan.id = planRef.id;
      console.log(`[SEED] Plan créé : ${planRef.id} (${plan.type})`);
    }
    // Ajout du callsign du vol principal au trip
    let mainCallsign = undefined;
    if (trip.plans && trip.plans.length > 0) {
      const mainFlight = trip.plans.find(p => p.type === 'flight' && p.details && p.details.callsign);
      if (mainFlight) mainCallsign = mainFlight.details.callsign;
    }
    const tripRef = db.collection('trips').doc();
    await tripRef.set({
      ...trip,
      id: tripRef.id,
      userId: DEMO_UID,
      createdByDemo: true,
      plans: trip.plans.map(p => p.id),
      callsign: mainCallsign
    });
    console.log(`[SEED] Voyage créé : ${tripRef.id}`);
  }
}

(async () => {
  console.log('--- PURGE DES DONNÉES DÉMO ---');
  await clearDemoData();
  console.log('--- SEED DES DONNÉES DÉMO ---');
  await seedDemoData();
  console.log('--- TERMINÉ ---');
  process.exit(0);
})(); 