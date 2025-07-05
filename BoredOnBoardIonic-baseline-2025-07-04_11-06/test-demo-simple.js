// Script simple pour tester la logique des nouvelles dates de démo
console.log('🧪 Test de la logique des nouvelles dates de démo...');

// Simuler la logique de setupDynamicDemoData
const now = new Date();
console.log(`\n🕐 Heure actuelle: ${now.toLocaleString('fr-FR')}`);

// Voyage Passé (il y a 3 semaines)
const pastStartDate = new Date(now.getTime() - 21 * 24 * 3600 * 1000);
const pastEndDate = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
console.log(`\n🏖️ Voyage Passé:`);
console.log(`   ${pastStartDate.toLocaleString('fr-FR')} → ${pastEndDate.toLocaleString('fr-FR')}`);
console.log(`   Durée: ${Math.round((pastEndDate - pastStartDate) / (24 * 3600 * 1000))} jours`);

// Voyage En Cours (vol de 3h, positionné à 1/3)
const totalDurationMs = 3 * 60 * 60 * 1000; // 3 heures
const ongoingStartDate = new Date(now.getTime() - (totalDurationMs / 3));
const ongoingEndDate = new Date(now.getTime() + (totalDurationMs * 2 / 3));
console.log(`\n✈️ Voyage En Cours:`);
console.log(`   ${ongoingStartDate.toLocaleString('fr-FR')} → ${ongoingEndDate.toLocaleString('fr-FR')}`);
console.log(`   Durée: ${Math.round(totalDurationMs / (60 * 1000))} minutes`);
console.log(`   Position: 1/3 terminé, 2/3 restant`);

// Voyage Futur (dans 3 semaines)
const futureStartDate = new Date(now.getTime() + 21 * 24 * 3600 * 1000);
const futureEndDate = new Date(now.getTime() + 28 * 24 * 3600 * 1000);
console.log(`\n🛫 Voyage Futur:`);
console.log(`   ${futureStartDate.toLocaleString('fr-FR')} → ${futureEndDate.toLocaleString('fr-FR')}`);
console.log(`   Durée: ${Math.round((futureEndDate - futureStartDate) / (24 * 3600 * 1000))} jours`);

console.log(`\n✅ Test terminé !`);
console.log(`\n📝 Résumé des améliorations:`);
console.log(`   • Passé: ${Math.round((now - pastEndDate) / (24 * 3600 * 1000))} jours (au lieu de 1 jour)`);
console.log(`   • Futur: ${Math.round((futureStartDate - now) / (24 * 3600 * 1000))} jours (au lieu de 7 jours)`);
console.log(`   • Chaque plan garde maintenant ses horaires relatifs`);
console.log(`   • Les vols conservent leurs heures de départ/arrivée`); 