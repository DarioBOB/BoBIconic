'use strict';

const axios = require('axios');
const dotenv = require('dotenv');
const NodeCache = require('node-cache');

dotenv.config();

// Debug: Vérifier si la clé API est chargée
console.log('Clé AviationStack:', process.env.AVIATIONSTACK_KEY ? 'Présente' : 'Manquante');

class FlightDataService {
  constructor() {
    this.openskyBaseUrl = 'https://opensky-network.org/api';
    this.aviationstackKey = process.env.AVIATIONSTACK_KEY;
    this.cache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds
  }

  async getFlightPosition(icao24) {
    const cacheKey = `position_${icao24}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) return cachedData;

    try {
      const url = `${this.openskyBaseUrl}/states/all?icao24=${icao24}`;
      const response = await axios.get(url);
      
      if (response.data?.states?.[0]) {
        const state = response.data.states[0];
        const data = {
          source: 'opensky',
          icao24: state[0],
          callsign: state[1],
          origin_country: state[2],
          time_position: state[3],
          last_contact: state[4],
          longitude: state[5],
          latitude: state[6],
          baro_altitude: state[7],
          on_ground: state[8],
          velocity: state[9],
          heading: state[10],
          vertical_rate: state[11],
          sensors: state[12],
          geo_altitude: state[13],
          squawk: state[14],
          spi: state[15],
          position_source: state[16]
        };
        this.cache.set(cacheKey, data);
        return data;
      }
      return null;
    } catch (err) {
      console.error('Erreur lors de la récupération de la position:', err.message);
      throw err;
    }
  }

  async getFlightDetails(flight_iata) {
    const cacheKey = `details_${flight_iata}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) return cachedData;

    try {
      if (!this.aviationstackKey) {
        console.warn('Clé AviationStack manquante. Certaines informations ne seront pas disponibles.');
        return null;
      }

      const url = `http://api.aviationstack.com/v1/flights?access_key=${this.aviationstackKey}&flight_iata=${flight_iata}`;
      const response = await axios.get(url);
      
      if (response.data?.data?.[0]) {
        const data = response.data.data[0];
        this.cache.set(cacheKey, data);
        return data;
      }
      return null;
    } catch (err) {
      console.error('Erreur lors de la récupération des détails du vol:', err.message);
      return null;
    }
  }

  async getAircraftByCallsign(callsign) {
    const cacheKey = `callsign_${callsign}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) return cachedData;

    try {
      const url = `${this.openskyBaseUrl}/states/all?callsign=${callsign}`;
      const response = await axios.get(url);
      
      if (response.data?.states) {
        const data = response.data.states.map(state => ({
          source: 'opensky',
          icao24: state[0],
          callsign: state[1],
          origin_country: state[2],
          time_position: state[3],
          last_contact: state[4],
          longitude: state[5],
          latitude: state[6],
          baro_altitude: state[7],
          on_ground: state[8],
          velocity: state[9],
          heading: state[10],
          vertical_rate: state[11],
          sensors: state[12],
          geo_altitude: state[13],
          squawk: state[14],
          spi: state[15],
          position_source: state[16]
        }));
        this.cache.set(cacheKey, data);
        return data;
      }
      return [];
    } catch (err) {
      console.error('Erreur lors de la recherche par indicatif:', err.message);
      throw err;
    }
  }

  async getNearbyAircraft(lat, lon, radius = 100) {
    const cacheKey = `nearby_${lat}_${lon}_${radius}`;
    const cachedData = this.cache.get(cacheKey);
    if (cachedData) return cachedData;

    try {
      const url = `${this.openskyBaseUrl}/states/all?lamin=${lat - radius/111}&lomin=${lon - radius/111}&lamax=${lat + radius/111}&lomax=${lon + radius/111}`;
      const response = await axios.get(url);
      
      if (response.data?.states) {
        const data = response.data.states.map(state => ({
          source: 'opensky',
          icao24: state[0],
          callsign: state[1],
          origin_country: state[2],
          time_position: state[3],
          last_contact: state[4],
          longitude: state[5],
          latitude: state[6],
          baro_altitude: state[7],
          on_ground: state[8],
          velocity: state[9],
          heading: state[10],
          vertical_rate: state[11],
          sensors: state[12],
          geo_altitude: state[13],
          squawk: state[14],
          spi: state[15],
          position_source: state[16]
        }));
        this.cache.set(cacheKey, data);
        return data;
      }
      return [];
    } catch (err) {
      console.error('Erreur lors de la recherche des avions à proximité:', err.message);
      throw err;
    }
  }

  async getAircraftRoute(icao24, begin, end) {
    try {
      const url = `${this.openskyBaseUrl}/flights/aircraft?icao24=${icao24}&begin=${begin}&end=${end}`;
      const response = await axios.get(url);
      
      if (response.data) {
        return response.data.map(flight => ({
          icao24: flight.icao24,
          firstSeen: flight.firstSeen,
          estDepartureAirport: flight.estDepartureAirport,
          lastSeen: flight.lastSeen,
          estArrivalAirport: flight.estArrivalAirport,
          callsign: flight.callsign,
          estDepartureAirportHorizDistance: flight.estDepartureAirportHorizDistance,
          estDepartureAirportVertDistance: flight.estDepartureAirportVertDistance,
          estArrivalAirportHorizDistance: flight.estArrivalAirportHorizDistance,
          estArrivalAirportVertDistance: flight.estArrivalAirportVertDistance,
          departureAirportCandidatesCount: flight.departureAirportCandidatesCount,
          arrivalAirportCandidatesCount: flight.arrivalAirportCandidatesCount
        }));
      }
      return [];
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'historique du vol:', err.message);
      throw err;
    }
  }
}

// Exemple d'utilisation
async function testFlightData() {
  const flightService = new FlightDataService();
  
  // Test avec un vol connu (ex: LH1234)
  const flight_iata = process.argv[2] || 'LH1234';
  
  try {
    // Récupérer les détails du vol via AviationStack
    const flightDetails = await flightService.getFlightDetails(flight_iata);
    if (flightDetails) {
      console.log('Détails du vol:', JSON.stringify(flightDetails, null, 2));
      
      // Si on a l'indicatif radio, chercher la position via OpenSky
      if (flightDetails.flight.icao) {
        const position = await flightService.getFlightPosition(flightDetails.flight.icao);
        if (position) {
          console.log('Position actuelle:', JSON.stringify(position, null, 2));
        }
      }
    } else {
      console.log('Aucun vol trouvé pour', flight_iata);
    }
  } catch (err) {
    console.error('Erreur lors du test:', err.message);
  }
}

// Exporter la classe pour une utilisation dans d'autres fichiers
module.exports = FlightDataService;

// Exécuter le test si le fichier est appelé directement
if (require.main === module) {
  testFlightData();
} 