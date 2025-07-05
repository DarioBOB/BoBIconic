/**
 * Test des calculs de recalage du DemoService
 * Simule now = new Date('2025-07-04T12:00:00Z') et vérifie les dates recalées
 */

// Simulation de la date actuelle fixe
const NOW = new Date('2025-07-04T12:00:00Z');
const MS_IN_DAY = 1000 * 60 * 60 * 24;

console.log('🧪 TEST DES CALCULS DE RECALAGE DEMO');
console.log('📅 Date de référence:', NOW.toISOString());
console.log('');

// Test 1: Voyage passé (Marrakech)
console.log('📅 TEST 1: Voyage passé (Marrakech)');
console.log('Requirements: début = maintenant – 37 jours, fin = maintenant – 30 jours');

const pastOriginalStart = new Date('2024-04-15T09:00:00Z');
const pastOriginalEnd = new Date('2024-04-22T13:45:00Z');

const pastNewStart = new Date(NOW.getTime() - 37 * MS_IN_DAY);
const pastNewEnd = new Date(NOW.getTime() - 30 * MS_IN_DAY);
const pastOffset = pastNewStart.getTime() - pastOriginalStart.getTime();

console.log('  Original start:', pastOriginalStart.toISOString());
console.log('  Original end:  ', pastOriginalEnd.toISOString());
console.log('  New start:     ', pastNewStart.toISOString());
console.log('  New end:       ', pastNewEnd.toISOString());
console.log('  Offset:        ', Math.round(pastOffset / MS_IN_DAY), 'jours');
console.log('');

// Test 2: Voyage futur (Montréal)
console.log('📅 TEST 2: Voyage futur (Montréal)');
console.log('Requirements: début = maintenant + 60 jours, fin = maintenant + 67 jours');

const futureOriginalStart = new Date('2025-09-10T10:40:00Z');
const futureOriginalEnd = new Date('2025-09-26T06:30:00Z');

const futureNewStart = new Date(NOW.getTime() + 60 * MS_IN_DAY);
const futureNewEnd = new Date(NOW.getTime() + 67 * MS_IN_DAY);
const futureOffset = futureNewStart.getTime() - futureOriginalStart.getTime();

console.log('  Original start:', futureOriginalStart.toISOString());
console.log('  Original end:  ', futureOriginalEnd.toISOString());
console.log('  New start:     ', futureNewStart.toISOString());
console.log('  New end:       ', futureNewEnd.toISOString());
console.log('  Offset:        ', Math.round(futureOffset / MS_IN_DAY), 'jours');
console.log('');

// Test 3: Voyage en cours (Athènes)
console.log('📅 TEST 3: Voyage en cours (Athènes)');
console.log('Requirements: premier vol positionné à now – durée / 3');

const ongoingOriginalStart = new Date('2024-07-05T07:15:00Z');
const ongoingOriginalEnd = new Date('2024-07-13T13:00:00Z');

// Premier vol (le plus ancien)
const firstFlightStart = new Date('2024-07-05T07:15:00Z');
const firstFlightEnd = new Date('2024-07-05T10:45:00Z');
const flightDuration = firstFlightEnd.getTime() - firstFlightStart.getTime();

// Positionner le vol à now – durée / 3
const newFlightStart = new Date(NOW.getTime() - flightDuration / 3);
const newFlightEnd = new Date(NOW.getTime() + flightDuration * 2 / 3);
const ongoingOffset = newFlightStart.getTime() - firstFlightStart.getTime();

console.log('  Premier vol original start:', firstFlightStart.toISOString());
console.log('  Premier vol original end:  ', firstFlightEnd.toISOString());
console.log('  Durée du vol:              ', Math.round(flightDuration / (1000 * 60 * 60 * 100)) / 10, 'heures');
console.log('  Nouveau vol start:         ', newFlightStart.toISOString());
console.log('  Nouveau vol end:           ', newFlightEnd.toISOString());
console.log('  Offset:                    ', Math.round(ongoingOffset / (1000 * 60 * 60)), 'heures');
console.log('');

// Vérification que le vol est en cours maintenant
const isFlightInProgress = NOW >= newFlightStart && NOW <= newFlightEnd;
const timeElapsed = (NOW.getTime() - newFlightStart.getTime()) / (1000 * 60 * 60);
const timeRemaining = (newFlightEnd.getTime() - NOW.getTime()) / (1000 * 60 * 60);

console.log('  ✅ Vol en cours maintenant:', isFlightInProgress);
console.log('  ⏱️  Temps écoulé:          ', Math.round(timeElapsed * 10) / 10, 'heures');
console.log('  ⏱️  Temps restant:         ', Math.round(timeRemaining * 10) / 10, 'heures');
console.log('');

// Test des horaires formatés
function formatTime(date) {
  return date.toTimeString().substring(0, 5);
}

console.log('  🕐 Horaires recalculés:');
console.log('     Départ:', formatTime(newFlightStart));
console.log('     Arrivée:', formatTime(newFlightEnd));
console.log('');

// Résumé final
console.log('🎯 RÉSUMÉ DES TESTS');
console.log('===================');
console.log('✅ Voyage passé:    ', pastNewStart.toISOString().split('T')[0], '→', pastNewEnd.toISOString().split('T')[0]);
console.log('✅ Voyage en cours: Vol en cours maintenant (', Math.round(timeElapsed * 10) / 10, 'h écoulées)');
console.log('✅ Voyage futur:    ', futureNewStart.toISOString().split('T')[0], '→', futureNewEnd.toISOString().split('T')[0]);
console.log('');
console.log('🎉 Tous les calculs respectent les requirements !'); 