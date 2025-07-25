/**
 * Test complet du mode démo
 * Simule le flux complet : DemoService.getDynamicDemoData() → TripsPage.loadTrips() → affichage
 */

// Simulation des données de base (3 voyages démo)
const demoData = {
  pastTplSrc: {
    id: 'past-trip-id',
    title: { fr: 'Marrakech', en: 'Marrakech' },
    startDate: new Date('2024-06-01T00:00:00Z'),
    endDate: new Date('2024-06-08T00:00:00Z'),
    plans: [
      {
        id: 'flight-past-1',
        type: 'flight',
        title: { fr: 'Vol Genève - Marrakech', en: 'Flight Geneva - Marrakech' },
        startDate: new Date('2024-06-01T08:00:00Z'),
        endDate: new Date('2024-06-01T11:30:00Z'),
        details: {
          flight: {
            flight_number: 'LX5678',
            departure: { airport: 'GVA' },
            arrival: { airport: 'RAK' },
            departure_time: '08:00',
            arrival_time: '11:30'
          }
        }
      },
      {
        id: 'hotel-past-1',
        type: 'hotel',
        title: { fr: 'Riad Marrakech', en: 'Marrakech Riad' },
        startDate: new Date('2024-06-01T14:00:00Z'),
        endDate: new Date('2024-06-08T10:00:00Z'),
        details: {
          hotel: {
            name: 'Riad Marrakech',
            address: 'Marrakech, Maroc'
          }
        }
      }
    ]
  },
  
  ongoingTplSrc: {
    id: 'ongoing-trip-id',
    title: { fr: 'Athènes', en: 'Athens' },
    startDate: new Date('2024-07-01T00:00:00Z'),
    endDate: new Date('2024-07-04T00:00:00Z'),
    plans: [
      {
        id: 'flight-ongoing-1',
        type: 'flight',
        title: { fr: 'Vol Genève - Athènes', en: 'Flight Geneva - Athens' },
        startDate: new Date('2024-07-01T07:15:00Z'),
        endDate: new Date('2024-07-01T09:45:00Z'),
        details: {
          flight: {
            flight_number: 'LX1234',
            departure: { airport: 'GVA' },
            arrival: { airport: 'ATH' },
            departure_time: '07:15',
            arrival_time: '09:45'
          }
        }
      },
      {
        id: 'hotel-ongoing-1',
        type: 'hotel',
        title: { fr: 'Hôtel Acropole', en: 'Acropolis Hotel' },
        startDate: new Date('2024-07-01T12:00:00Z'),
        endDate: new Date('2024-07-04T10:00:00Z'),
        details: {
          hotel: {
            name: 'Acropolis Hotel',
            address: 'Athènes, Grèce'
          }
        }
      }
    ]
  },
  
  futureTplSrc: {
    id: 'future-trip-id',
    title: { fr: 'Montréal', en: 'Montreal' },
    startDate: new Date('2024-09-01T00:00:00Z'),
    endDate: new Date('2024-09-08T00:00:00Z'),
    plans: [
      {
        id: 'flight-future-1',
        type: 'flight',
        title: { fr: 'Vol Genève - Montréal', en: 'Flight Geneva - Montreal' },
        startDate: new Date('2024-09-01T10:00:00Z'),
        endDate: new Date('2024-09-01T13:30:00Z'),
        details: {
          flight: {
            flight_number: 'LX9999',
            departure: { airport: 'GVA' },
            arrival: { airport: 'YUL' },
            departure_time: '10:00',
            arrival_time: '13:30'
          }
        }
      },
      {
        id: 'hotel-future-1',
        type: 'hotel',
        title: { fr: 'Hôtel Montréal', en: 'Montreal Hotel' },
        startDate: new Date('2024-09-01T16:00:00Z'),
        endDate: new Date('2024-09-08T11:00:00Z'),
        details: {
          hotel: {
            name: 'Montreal Hotel',
            address: 'Montréal, Canada'
          }
        }
      }
    ]
  }
};

// Simulation de DemoService.getDynamicDemoData()
function getDynamicDemoData() {
  const now = new Date();
  const MS_IN_DAY = 1000 * 60 * 60 * 24;
  
  // Clone profond
  const pastTpl = JSON.parse(JSON.stringify(demoData.pastTplSrc));
  const ongoingTpl = JSON.parse(JSON.stringify(demoData.ongoingTplSrc));
  const futureTpl = JSON.parse(JSON.stringify(demoData.futureTplSrc));
  
  // Conversion en Date
  [pastTpl, ongoingTpl, futureTpl].forEach(trip => {
    trip.startDate = new Date(trip.startDate);
    trip.endDate = new Date(trip.endDate);
    if (trip.plans) {
      trip.plans.forEach(plan => {
        plan.startDate = new Date(plan.startDate);
        plan.endDate = new Date(plan.endDate);
      });
    }
  });
  
  // --- Voyage passé : il y a 30 jours ---
  pastTpl.startDate = new Date(now.getTime() - 37 * MS_IN_DAY);
  pastTpl.endDate = new Date(now.getTime() - 30 * MS_IN_DAY);
  if (pastTpl.plans) {
    pastTpl.plans = shiftPlans(pastTpl, demoData.pastTplSrc.startDate, pastTpl.startDate);
  }
  
  // --- Voyage en cours : positionné au 1/3 de sa durée ---
  const origStartDate = new Date(demoData.ongoingTplSrc.startDate);
  const origEndDate = new Date(demoData.ongoingTplSrc.endDate);
  const durationMs = origEndDate.getTime() - origStartDate.getTime();
  
  const newStartDate = new Date(now.getTime() - durationMs / 3);
  const newEndDate = new Date(newStartDate.getTime() + durationMs);
  
  ongoingTpl.startDate = newStartDate;
  ongoingTpl.endDate = newEndDate;
  
  if (ongoingTpl.plans) {
    ongoingTpl.plans = shiftPlans(ongoingTpl, origStartDate, newStartDate);
  }
  
  // --- Voyage futur : dans 60 jours ---
  futureTpl.startDate = new Date(now.getTime() + 60 * MS_IN_DAY);
  futureTpl.endDate = new Date(now.getTime() + 67 * MS_IN_DAY);
  if (futureTpl.plans) {
    futureTpl.plans = shiftPlans(futureTpl, demoData.futureTplSrc.startDate, futureTpl.startDate);
  }
  
  return [pastTpl, ongoingTpl, futureTpl];
}

// Simulation de shiftPlans (même logique que DemoService)
function shiftPlans(trip, origBaseDate, newBaseDate) {
  if (!trip.plans || !Array.isArray(trip.plans)) {
    return [];
  }

  const origStart = new Date(origBaseDate);
  const newStart = new Date(newBaseDate);

  return trip.plans.map((plan) => {
    const origPlanStart = new Date(plan.startDate);
    const origPlanEnd = new Date(plan.endDate);
    
    if (!origPlanStart || !origPlanEnd) {
      return plan;
    }

    const offsetStart = origPlanStart.getTime() - origStart.getTime();
    const offsetEnd = origPlanEnd.getTime() - origStart.getTime();
    
    const newPlanStart = new Date(newStart.getTime() + offsetStart);
    const newPlanEnd = new Date(newStart.getTime() + offsetEnd);

    const newPlan = {
      ...plan,
      startDate: newPlanStart,
      endDate: newPlanEnd,
      icon: getIconNameForPlan(plan.type)
    };

    // Mettre à jour les horaires de vol
    if (plan.type === 'flight' && plan.details && plan.details.flight) {
      newPlan.details = {
        ...plan.details,
        flight: {
          ...plan.details.flight,
          departure_time: formatTime(newPlanStart),
          arrival_time: formatTime(newPlanEnd)
        }
      };
    }

    return newPlan;
  });
}

function getIconNameForPlan(type) {
  switch (type) {
    case 'flight': return 'airplane';
    case 'hotel': return 'bed';
    case 'car_rental': return 'car';
    case 'activity': return 'walk';
    case 'ferry': return 'boat';
    default: return 'time';
  }
}

function formatTime(date) {
  return date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

// Simulation de TripsPage.loadTrips() (mode démo)
function loadTrips(rawTrips) {
  return rawTrips.map(raw => {
    const sd = new Date(raw.startDate);
    const ed = new Date(raw.endDate);
    return {
      id: raw.id,
      title: raw.title,
      startDate: sd,
      endDate: ed,
      status: getTripStatus(sd, ed),
      showDetails: false,
      loadingPlans: false,
      plans: (raw.plans || []).map((p) => ({
        ...p,
        startDate: new Date(p.startDate),
        endDate: new Date(p.endDate),
        // Préserver l'icône si elle existe (cas du mode démo)
        icon: p.icon || getPlanIcon(p.type)
      }))
    };
  });
}

function getTripStatus(startDate, endDate) {
  const now = new Date();
  if (now < startDate) return 'upcoming';
  if (now > endDate) return 'past';
  return 'ongoing';
}

function getPlanIcon(type) {
  switch (type) {
    case 'flight': return 'airplane';
    case 'hotel': return 'bed';
    case 'car_rental': return 'car';
    case 'activity': return 'walk';
    case 'ferry': return 'boat';
    default: return 'time';
  }
}

// Simulation de l'affichage des horaires (comme dans le template)
function getDepartureTime(plan) {
  const t = plan.details?.flight?.departure_time || plan.details?.departure_time || plan.startTime || plan.startDate;
  if (typeof t === 'string' && t.includes(':')) {
    // Si c'est déjà une chaîne d'horaire (HH:mm), la retourner directement
    return t;
  }
  return t ? formatTime(new Date(t)) : '';
}

function getArrivalTime(plan) {
  const t = plan.details?.flight?.arrival_time || plan.details?.arrival_time || plan.endTime || plan.endDate;
  if (typeof t === 'string' && t.includes(':')) {
    // Si c'est déjà une chaîne d'horaire (HH:mm), la retourner directement
    return t;
  }
  return t ? formatTime(new Date(t)) : '';
}

// Test complet
console.log('=== TEST COMPLET DU MODE DÉMO ===\n');

const now = new Date();
console.log('Heure actuelle:', now.toLocaleString('fr-FR'));

// 1. Génération des données dynamiques
console.log('1. Génération des données dynamiques...');
const rawTrips = getDynamicDemoData();

// 2. Transformation pour l'affichage
console.log('2. Transformation pour l\'affichage...');
const trips = loadTrips(rawTrips);

// 3. Affichage des résultats
console.log('\n3. RÉSULTATS FINAUX:');
trips.forEach((trip, index) => {
  const tripNames = ['Marrakech (Passé)', 'Athènes (En cours)', 'Montréal (Futur)'];
  console.log(`\n--- ${tripNames[index]} ---`);
  console.log(`Statut: ${trip.status}`);
  console.log(`Période: ${trip.startDate.toLocaleDateString('fr-FR')} → ${trip.endDate.toLocaleDateString('fr-FR')}`);
  
  if (trip.plans) {
    console.log('Plans:');
    trip.plans.forEach((plan, planIndex) => {
      console.log(`  ${planIndex + 1}. ${plan.title.fr || plan.title}`);
      console.log(`     Type: ${plan.type} | Icône: ${plan.icon}`);
      console.log(`     Début: ${plan.startDate.toLocaleString('fr-FR')}`);
      console.log(`     Fin: ${plan.endDate.toLocaleString('fr-FR')}`);
      
      if (plan.type === 'flight') {
        const depTime = getDepartureTime(plan);
        const arrTime = getArrivalTime(plan);
        console.log(`     Vol: ${plan.details?.flight?.flight_number || 'N/A'}`);
        console.log(`     Horaires: ${depTime} → ${arrTime}`);
        
        // Vérification que les horaires sont cohérents
        const expectedDep = formatTime(plan.startDate);
        const expectedArr = formatTime(plan.endDate);
        if (depTime === expectedDep && arrTime === expectedArr) {
          console.log(`     ✅ Horaires cohérents`);
        } else {
          console.log(`     ❌ Horaires incohérents (attendu: ${expectedDep} → ${expectedArr})`);
        }
      }
    });
  }
});

// 4. Vérifications spécifiques
console.log('\n4. VÉRIFICATIONS SPÉCIFIQUES:');

// Voyage en cours positionné à 1/3
const ongoingTrip = trips[1];
const ongoingDuration = ongoingTrip.endDate.getTime() - ongoingTrip.startDate.getTime();
const ongoingPosition = (now.getTime() - ongoingTrip.startDate.getTime()) / ongoingDuration;
console.log(`Voyage en cours positionné à: ${Math.round(ongoingPosition * 100)}% (attendu: ~33%)`);

// Icônes présentes
const allPlans = trips.flatMap(t => t.plans || []);
const plansWithIcons = allPlans.filter(p => p.icon);
console.log(`Plans avec icônes: ${plansWithIcons.length}/${allPlans.length}`);

// Horaires de vol mis à jour
const flightPlans = allPlans.filter(p => p.type === 'flight');
const flightsWithUpdatedTimes = flightPlans.filter(p => {
  const depTime = getDepartureTime(p);
  const arrTime = getArrivalTime(p);
  const expectedDep = formatTime(p.startDate);
  const expectedArr = formatTime(p.endDate);
  return depTime === expectedDep && arrTime === expectedArr;
});
console.log(`Vols avec horaires mis à jour: ${flightsWithUpdatedTimes.length}/${flightPlans.length}`);

console.log('\n✅ Test complet terminé.'); 