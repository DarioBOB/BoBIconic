/**
 * Test du recalage du voyage en cours (Athènes)
 * Vérifie que les horaires de vol sont correctement mis à jour
 */

// Place la déclaration de 'now' tout en haut du fichier
const now = new Date();

// Données originales du voyage Athènes (exemple)
const ongoingTplSrc = {
  id: 'ongoing-trip-id',
  title: { fr: 'Athènes', en: 'Athens' },
  startDate: new Date('2024-01-15T10:00:00Z'),
  endDate: new Date('2024-01-18T16:00:00Z'),
  plans: [
    {
      id: 'flight-1',
      type: 'flight',
      title: { fr: 'Vol Genève - Athènes', en: 'Flight Geneva - Athens' },
      startDate: new Date('2024-01-15T07:15:00Z'),
      endDate: new Date('2024-01-15T09:45:00Z'),
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
      id: 'hotel-1',
      type: 'hotel',
      title: { fr: 'Hôtel Acropole', en: 'Acropolis Hotel' },
      startDate: new Date('2024-01-15T12:00:00Z'),
      endDate: new Date('2024-01-18T10:00:00Z'),
      details: {
        hotel: {
          name: 'Acropolis Hotel',
          address: 'Athènes, Grèce'
        }
      }
    }
  ]
};

// Simulation de la méthode shiftPlans
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

    // Créer le nouveau plan avec les dates recalculées
    const newPlan = {
      ...plan,
      startDate: newPlanStart,
      endDate: newPlanEnd,
      icon: getIconNameForPlan(plan.type)
    };

    // Mettre à jour les horaires de vol si c'est un plan de type 'flight'
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

// Simulation du recalage du voyage en cours
const origStartDate = new Date(ongoingTplSrc.startDate);
const origEndDate = new Date(ongoingTplSrc.endDate);
const durationMs = origEndDate.getTime() - origStartDate.getTime();

// Positionner la nouvelle date de départ à now - durationMs/3
const newStartDate = new Date(now.getTime() - durationMs / 3);
// Positionner la nouvelle date d'arrivée à newStart + durationMs
const newEndDate = new Date(newStartDate.getTime() + durationMs);

console.log('\n=== RECALAGE DU VOYAGE EN COURS ===');
console.log('Date originale de début:', origStartDate.toLocaleString('fr-FR'));
console.log('Date originale de fin:', origEndDate.toLocaleString('fr-FR'));
console.log('Durée totale:', Math.round(durationMs / (1000 * 60 * 60 * 24) * 100) / 100, 'jours');
console.log('Nouvelle date de début:', newStartDate.toLocaleString('fr-FR'));
console.log('Nouvelle date de fin:', newEndDate.toLocaleString('fr-FR'));
console.log('Position relative:', Math.round((now.getTime() - newStartDate.getTime()) / durationMs * 100), '% du voyage');

// Appliquer le décalage aux plans
const recalculatedPlans = shiftPlans(ongoingTplSrc, origStartDate, newStartDate);

console.log('\n=== PLANS RECALCULÉS ===');
recalculatedPlans.forEach((plan, index) => {
  console.log(`\nPlan ${index + 1}: ${plan.title.fr || plan.title}`);
  console.log(`  Type: ${plan.type}`);
  console.log(`  Icône: ${plan.icon}`);
  console.log(`  Début: ${plan.startDate.toLocaleString('fr-FR')}`);
  console.log(`  Fin: ${plan.endDate.toLocaleString('fr-FR')}`);
  
  if (plan.type === 'flight' && plan.details?.flight) {
    console.log(`  Vol: ${plan.details.flight.flight_number}`);
    console.log(`  Départ: ${plan.details.flight.departure_time} (${plan.details.flight.departure.airport})`);
    console.log(`  Arrivée: ${plan.details.flight.arrival_time} (${plan.details.flight.arrival.airport})`);
  }
});

console.log('\n=== VÉRIFICATION ===');
const flightPlan = recalculatedPlans.find(p => p.type === 'flight');
if (flightPlan) {
  const flightStart = new Date(flightPlan.startDate);
  const flightEnd = new Date(flightPlan.endDate);
  const flightDuration = flightEnd.getTime() - flightStart.getTime();
  const positionInFlight = (now.getTime() - flightStart.getTime()) / flightDuration;
  
  console.log(`Position dans le vol: ${Math.round(positionInFlight * 100)}%`);
  console.log(`Horaires affichés: ${flightPlan.details.flight.departure_time} → ${flightPlan.details.flight.arrival_time}`);
  console.log(`Horaires calculés: ${formatTime(flightStart)} → ${formatTime(flightEnd)}`);
  
  if (flightPlan.details.flight.departure_time === formatTime(flightStart) && 
      flightPlan.details.flight.arrival_time === formatTime(flightEnd)) {
    console.log('✅ Horaires de vol correctement mis à jour');
  } else {
    console.log('❌ Erreur dans la mise à jour des horaires de vol');
  }
}

console.log('\nTest terminé.'); 

// Test de recalage du voyage en cours selon Requirements Démo.txt

console.log('Date courante :', now.toLocaleString('fr-FR'));

// Exemple de voyage en cours (structure simplifiée)
const demoOngoing = {
  startDate: new Date('2024-07-01T00:00:00Z'),
  endDate:   new Date('2024-07-05T00:00:00Z'),
  plans: [
    {
      id: 'flight1',
      type: 'flight',
      startDate: new Date('2024-07-01T12:00:00Z'),
      endDate:   new Date('2024-07-01T14:30:00Z'),
      details: {
        flight: {
          flight_number: 'A3 847',
          departure: { airport: 'GVA' },
          arrival:   { airport: 'ATH' },
          departure_time: '12:00',
          arrival_time: '14:30'
        }
      }
    },
    // ... autres plans ...
  ]
};

// 1. Identifier le premier vol
const firstFlight = demoOngoing.plans
  .filter(p => p.type === 'flight')
  .sort((a, b) => a.startDate - b.startDate)[0];

if (!firstFlight) {
  console.log('Aucun vol trouvé dans le voyage en cours.');
  process.exit(1);
}

const origFlightStart = new Date(firstFlight.startDate);
const origFlightEnd   = new Date(firstFlight.endDate);
const flightDuration  = origFlightEnd.getTime() - origFlightStart.getTime();

// 2. Nouveau départ du vol : now - (durée du vol / 3)
const newFlightStart = new Date(now.getTime() - flightDuration / 3);
const newFlightEnd   = new Date(newFlightStart.getTime() + flightDuration);
const offsetOngoing  = newFlightStart.getTime() - origFlightStart.getTime();

// 3. Appliquer l'offset à tous les plans (ici, juste le vol)
const recalculatedFlight = {
  ...firstFlight,
  startDate: newFlightStart,
  endDate:   newFlightEnd,
  details: {
    ...firstFlight.details,
    flight: {
      ...firstFlight.details.flight,
      departure_time: formatTime(newFlightStart),
      arrival_time:   formatTime(newFlightEnd)
    }
  }
};

console.log('\nRésultat attendu pour le 1er vol du voyage en cours :');
console.log('Départ (date recalée) :', recalculatedFlight.startDate.toLocaleString('fr-FR'));
console.log('Arrivée (date recalée) :', recalculatedFlight.endDate.toLocaleString('fr-FR'));
console.log('Heure de départ affichée :', recalculatedFlight.details.flight.departure_time);
console.log('Heure d\'arrivée affichée :', recalculatedFlight.details.flight.arrival_time);

function formatTime(date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
} 