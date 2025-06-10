'use strict';

const https = require('https');

// Get flight number from command line or use default
const flightNumber = process.argv[2] || 'EZS1529';

console.log(`[FR24] Testing flight: ${flightNumber}`);

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
  console.error('[FR24] Request timed out after 10 seconds');
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

// First get the flight ID
const searchUrl = `https://www.flightradar24.com/v1/search/web/find?query=${flightNumber}&limit=1`;

makeRequest(searchUrl)
  .then(searchResult => {
    if (!searchResult || !searchResult.results || searchResult.results.length === 0) {
      throw new Error('Flight not found');
    }

    const flightId = searchResult.results[0].id;
    console.log(`[FR24] Found flight ID: ${flightId}`);

    // Then get the flight details
    const detailsUrl = `https://www.flightradar24.com/v1/flights/${flightId}`;
    return makeRequest(detailsUrl);
  })
  .then(flight => {
    clearTimeout(timeout);
    
    if (!flight || !flight.result) {
      console.log('[FR24] No data found for this flight');
      process.exit(0);
    }

    const data = flight.result.response.data[0];
    
    console.log('\n[FR24] Flight Details:');
    console.log('-------------------');
    console.log(`Flight: ${data.identification?.number || 'N/A'}`);
    console.log(`Status: ${data.status?.text || 'N/A'}`);
    console.log(`Aircraft: ${data.aircraft?.model?.text || 'N/A'}`);
    console.log(`Airline: ${data.airline?.name || 'N/A'}`);
    
    if (data.airport) {
      console.log('\nAirports:');
      console.log(`Origin: ${data.airport.origin?.name || 'N/A'} (${data.airport.origin?.code?.iata || 'N/A'})`);
      console.log(`Destination: ${data.airport.destination?.name || 'N/A'} (${data.airport.destination?.code?.iata || 'N/A'})`);
    }

    if (data.time) {
      console.log('\nTimes:');
      console.log(`Scheduled Departure: ${data.time.scheduled?.departure || 'N/A'}`);
      console.log(`Scheduled Arrival: ${data.time.scheduled?.arrival || 'N/A'}`);
      console.log(`Actual Departure: ${data.time.actual?.departure || 'N/A'}`);
      console.log(`Actual Arrival: ${data.time.actual?.arrival || 'N/A'}`);
    }

    // Log full response for debugging
    console.log('\n[FR24] Full Response:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(err => {
    clearTimeout(timeout);
    console.error('[FR24] Error:', err.message);
    process.exit(1);
  }); 