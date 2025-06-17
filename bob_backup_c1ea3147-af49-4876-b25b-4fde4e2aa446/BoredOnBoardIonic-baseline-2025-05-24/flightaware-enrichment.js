'use strict';

const https = require('https');
require('dotenv').config();

// Get flight number from command line or use default
const flightNumber = process.argv[2] || 'EZS1529';

// FlightAware API configuration
const API_KEY = process.env.FLIGHTAWARE_KEY;
if (!API_KEY) {
  console.error('[FlightAware] Error: FLIGHTAWARE_KEY not found in .env file');
  process.exit(1);
}

console.log(`[FlightAware] Searching for flight: ${flightNumber}`);

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
  console.error('[FlightAware] Request timed out after 10 seconds');
  process.exit(1);
}, 10000);

// Function to make HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'x-apikey': API_KEY,
        'Accept': 'application/json'
      }
    };

    https.get(url, options, (res) => {
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
      number: flight.fa_flight_id || 'N/A',
      status: flight.status || 'N/A',
      last_position: flight.last_position || 'N/A'
    },
    departure: {
      airport: flight.origin?.name || 'N/A',
      code: flight.origin?.code || 'N/A',
      scheduled: formatDate(flight.scheduled_out),
      actual: formatDate(flight.actual_out),
      terminal: flight.origin_terminal || 'N/A',
      gate: flight.origin_gate || 'N/A'
    },
    arrival: {
      airport: flight.destination?.name || 'N/A',
      code: flight.destination?.code || 'N/A',
      scheduled: formatDate(flight.scheduled_in),
      actual: formatDate(flight.actual_in),
      terminal: flight.destination_terminal || 'N/A',
      gate: flight.destination_gate || 'N/A'
    },
    airline: {
      name: flight.operator?.name || 'N/A',
      code: flight.operator?.code || 'N/A'
    },
    aircraft: {
      type: flight.aircraft_type || 'N/A',
      registration: flight.registration || 'N/A'
    },
    route: {
      distance: flight.route_distance ? `${flight.route_distance}nm` : 'N/A',
      duration: flight.flight_time ? `${flight.flight_time} minutes` : 'N/A'
    }
  };
}

// Make request to FlightAware API
const apiUrl = `https://aeroapi.flightaware.com/aeroapi/flights/${flightNumber}`;

makeRequest(apiUrl)
  .then(response => {
    clearTimeout(timeout);
    
    if (!response.flights || response.flights.length === 0) {
      console.log('[FlightAware] No flight data found');
      process.exit(0);
    }

    const flight = response.flights[0];
    const info = extractFlightInfo(flight);
    
    console.log('\n[FlightAware] Flight Information:');
    console.log('--------------------------------');
    console.log(`Flight: ${info.flight.number} (${info.flight.status})`);
    console.log(`Last Position: ${info.flight.last_position}`);
    
    console.log('\nDeparture:');
    console.log(`Airport: ${info.departure.airport} (${info.departure.code})`);
    console.log(`Scheduled: ${info.departure.scheduled}`);
    console.log(`Actual: ${info.departure.actual}`);
    console.log(`Terminal: ${info.departure.terminal}`);
    console.log(`Gate: ${info.departure.gate}`);
    
    console.log('\nArrival:');
    console.log(`Airport: ${info.arrival.airport} (${info.arrival.code})`);
    console.log(`Scheduled: ${info.arrival.scheduled}`);
    console.log(`Actual: ${info.arrival.actual}`);
    console.log(`Terminal: ${info.arrival.terminal}`);
    console.log(`Gate: ${info.arrival.gate}`);
    
    console.log('\nAirline:');
    console.log(`Name: ${info.airline.name}`);
    console.log(`Code: ${info.airline.code}`);
    
    console.log('\nAircraft:');
    console.log(`Type: ${info.aircraft.type}`);
    console.log(`Registration: ${info.aircraft.registration}`);

    console.log('\nRoute:');
    console.log(`Distance: ${info.route.distance}`);
    console.log(`Duration: ${info.route.duration}`);

    // Log full response for debugging
    console.log('\n[FlightAware] Full Response:');
    console.log(JSON.stringify(info, null, 2));
  })
  .catch(err => {
    clearTimeout(timeout);
    console.error('[FlightAware] Error:', err.message);
    if (err.response) {
      console.error('[FlightAware] Response status:', err.response.status);
      console.error('[FlightAware] Response data:', err.response.data);
    }
    process.exit(1);
  }); 