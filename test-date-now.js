// test-date-now.js

console.log('🕒 Date et heure système (locale et UTC) :');

const now = new Date();
console.log('Locale :', now.toLocaleString());
console.log('ISO    :', now.toISOString());
console.log('UTC    :', now.toUTCString());

// Détection du fuseau horaire
console.log('\n🌍 Informations fuseau horaire :');
console.log('Fuseau local :', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Offset local :', now.getTimezoneOffset(), 'minutes');

// Date dans le fuseau local
const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
console.log('Date locale ISO :', localDate.toISOString());

// Test avec différents formats
console.log('\n📅 Formats de date :');
console.log('Français :', now.toLocaleString('fr-FR', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
console.log('Anglais  :', now.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })); 