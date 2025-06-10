'use strict';

const https = require('https');
require('dotenv').config();

// Get flight number from command line or use default
const flightNumber = process.argv[2] || 'EZS1529';

// AviationStack API configuration
const API_KEY = process.env.AVIATIONSTACK_KEY;
if (!API_KEY) {
  console.error('[AviationStack] Error: AVIATIONSTACK_KEY not found in .env file');
  process.exit(1);
}

console.log(`[AviationStack] Searching for flight: ${flightNumber}`);

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
  console.error('[AviationStack] Request timed out after 10 seconds');
  process.exit(1);
}, 10000);

// Function to make HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to format date
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

// Function to extract relevant flight information
function extractFlightInfo(flight) {
  return {
    flight: {
      number: flight.flight?.iata || flight.flight?.icao || 'N/A',
      status: flight.flight_status || 'N/A',
      date: flight.flight_date || 'N/A'
    },
    departure: {
      airport: flight.departure?.airport || 'N/A',
      iata: flight.departure?.iata || 'N/A',
      scheduled: formatDate(flight.departure?.scheduled),
      actual: formatDate(flight.departure?.actual),
      terminal: flight.departure?.terminal || 'N/A',
      gate: flight.departure?.gate || 'N/A'
    },
    arrival: {
      airport: flight.arrival?.airport || 'N/A',
      iata: flight.arrival?.iata || 'N/A',
      scheduled: formatDate(flight.arrival?.scheduled),
      actual: formatDate(flight.arrival?.actual),
      terminal: flight.arrival?.terminal || 'N/A',
      gate: flight.arrival?.gate || 'N/A'
    },
    airline: {
      name: flight.airline?.name || 'N/A',
      iata: flight.airline?.iata || 'N/A',
      icao: flight.airline?.icao || 'N/A'
    },
    aircraft: {
      registration: flight.aircraft?.registration || 'N/A',
      iata: flight.aircraft?.iata || 'N/A',
      icao: flight.aircraft?.icao || 'N/A'
    }
  };
}

// Make request to AviationStack API
const apiUrl = `https://api.aviationstack.com/v1/flights?access_key=${API_KEY}&flight_iata=${flightNumber}`;

makeRequest(apiUrl)
  .then(response => {
    clearTimeout(timeout);
    
    if (!response.data || response.data.length === 0) {
      console.log('[AviationStack] No flight data found');
      process.exit(0);
    }

    const flight = response.data[0];
    const info = extractFlightInfo(flight);
    
    console.log('\n[AviationStack] Flight Information:');
    console.log('--------------------------------');
    console.log(`Flight: ${info.flight.number} (${info.flight.status})`);
    console.log(`Date: ${info.flight.date}`);
    
    console.log('\nDeparture:');
    console.log(`Airport: ${info.departure.airport} (${info.departure.iata})`);
    console.log(`Scheduled: ${info.departure.scheduled}`);
    console.log(`Actual: ${info.departure.actual}`);
    console.log(`Terminal: ${info.departure.terminal}`);
    console.log(`Gate: ${info.departure.gate}`);
    
    console.log('\nArrival:');
    console.log(`Airport: ${info.arrival.airport} (${info.arrival.iata})`);
    console.log(`Scheduled: ${info.arrival.scheduled}`);
    console.log(`Actual: ${info.arrival.actual}`);
    console.log(`Terminal: ${info.arrival.terminal}`);
    console.log(`Gate: ${info.arrival.gate}`);
    
    console.log('\nAirline:');
    console.log(`Name: ${info.airline.name}`);
    console.log(`IATA: ${info.airline.iata}`);
    console.log(`ICAO: ${info.airline.icao}`);
    
    console.log('\nAircraft:');
    console.log(`Registration: ${info.aircraft.registration}`);
    console.log(`IATA: ${info.aircraft.iata}`);
    console.log(`ICAO: ${info.aircraft.icao}`);

    // Log full response for debugging
    console.log('\n[AviationStack] Full Response:');
    console.log(JSON.stringify(info, null, 2));
  })
  .catch(err => {
    clearTimeout(timeout);
    console.error('[AviationStack] Error:', err.message);
    if (err.response) {
      console.error('[AviationStack] Response status:', err.response.status);
      console.error('[AviationStack] Response data:', err.response.data);
    }
    process.exit(1);
  }); 