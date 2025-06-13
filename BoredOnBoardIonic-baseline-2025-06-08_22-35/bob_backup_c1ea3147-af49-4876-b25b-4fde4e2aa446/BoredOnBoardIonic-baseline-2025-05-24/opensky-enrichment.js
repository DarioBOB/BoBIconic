'use strict';
const fetch = require('node-fetch');

/**
 * Enrichit un vol avec OpenSky Network (POC)
 * @param {string} flightNumber - Numéro de vol (ex: 'EZS1529')
 * @param {string} date - Date de départ (format ISO ou YYYY-MM-DD)
 * @returns {Promise<object>} Données brutes OpenSky ou null
 */
async function enrichFlightWithOpenSky(flightNumber, date) {
  // OpenSky ne fournit pas d'API REST publique pour les historiques de vol par numéro, mais on peut tester l'API flights/all (live)
  // Pour un vrai enrichissement, il faudra une clé et/ou utiliser d'autres endpoints ou un proxy
  const url = `https://opensky-network.org/api/flights/all?begin=${Math.floor(new Date(date).getTime()/1000)-3600}&end=${Math.floor(new Date(date).getTime()/1000)+3600}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OpenSky API error: ' + res.status);
    const data = await res.json();
    // Filtrer par numéro de vol si possible
    const match = data.find(f => f.callsign && f.callsign.replace(/\s/g,'').toUpperCase().includes(flightNumber.replace(/\s/g,'').toUpperCase()));
    return match || null;
  } catch (e) {
    console.error('[OpenSky] Error:', e.message);
    return null;
  }
}

// Exemple d'utilisation (POC)
if (require.main === module) {
  const flight = process.argv[2] || 'EZS1529';
  const date = process.argv[3] || new Date().toISOString();
  enrichFlightWithOpenSky(flight, date).then(data => {
    console.log('[OpenSky] Result:', data);
  });
}

module.exports = { enrichFlightWithOpenSky }; 