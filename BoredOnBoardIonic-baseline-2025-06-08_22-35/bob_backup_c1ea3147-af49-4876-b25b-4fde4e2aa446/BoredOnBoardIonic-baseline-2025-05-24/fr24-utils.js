var axios = require('axios');

async function enrichFlightWithFR24(flight) {
  if (!process.env.FR24_API_KEY) {
    // Mock de réponse si pas de clé API
    return {
      status: 'unknown',
      registration: null,
      real_times: { departure: null, arrival: null },
      aircraft_type: flight.aircraft_type || null
    };
  }
  try {
    // Exemple d'appel API (adapter selon le fournisseur réel)
    const resp = await axios.get('https://api.flightradar24.com/common/v1/flight/list.json', {
      params: {
        query: flight.flight_number,
        fetchBy: 'flight',
        apiKey: process.env.FR24_API_KEY
      }
    });
    // Adapter le parsing selon la réponse réelle de l'API
    const data = resp.data.result.response.data[0] || {};
    return {
      status: data.status || 'unknown',
      registration: data.aircraft?.registration || null,
      real_times: {
        departure: data.time?.real?.departure || null,
        arrival: data.time?.real?.arrival || null
      },
      aircraft_type: data.aircraft?.model || flight.aircraft_type || null
    };
  } catch (err) {
    return {
      status: 'error',
      registration: null,
      real_times: { departure: null, arrival: null },
      aircraft_type: flight.aircraft_type || null,
      error: err.message
    };
  }
}

module.exports = { enrichFlightWithFR24 }; 