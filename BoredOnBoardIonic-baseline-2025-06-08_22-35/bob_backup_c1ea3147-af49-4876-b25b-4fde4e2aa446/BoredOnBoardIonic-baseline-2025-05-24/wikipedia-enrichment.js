'use strict';

const https = require('https');

// Get search type and query from command line
const searchType = process.argv[2] || 'flight'; // 'flight' or 'aircraft'
const searchQuery = process.argv[3] || (searchType === 'flight' ? 'Boeing 737' : 'Airbus A320');

console.log(`[Wikipedia] Searching for ${searchType}: ${searchQuery}`);

// Add timeout to prevent hanging
const timeout = setTimeout(() => {
  console.error('[Wikipedia] Request timed out after 10 seconds');
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

// Function to extract relevant information based on search type
function extractRelevantInfo(page) {
  const info = {
    title: page.title,
    description: page.extract ? page.extract.split('\n')[0] : 'No description available',
    image: page.original ? page.original.source : null,
    fullText: page.extract || 'No content available'
  };

  // Extract specific information based on search type
  if (searchType === 'aircraft') {
    // Look for specifications in the text
    const specsMatch = info.fullText.match(/Specifications[^]*?(?=\n\n|\n$)/i);
    if (specsMatch) {
      info.specifications = specsMatch[0];
    }
  } else if (searchType === 'flight') {
    // Look for flight-related information
    const flightMatch = info.fullText.match(/Flight[^]*?(?=\n\n|\n$)/i);
    if (flightMatch) {
      info.flightInfo = flightMatch[0];
    }
  }

  return info;
}

// First search for the query
const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`;

makeRequest(searchUrl)
  .then(searchResult => {
    if (!searchResult.query || !searchResult.query.search || searchResult.query.search.length === 0) {
      throw new Error(`${searchType} not found`);
    }

    const pageId = searchResult.query.search[0].pageid;
    console.log(`[Wikipedia] Found page ID: ${pageId}`);

    // Then get the page content with more details
    const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=original&pageids=${pageId}&format=json&origin=*`;
    return makeRequest(contentUrl);
  })
  .then(pageData => {
    clearTimeout(timeout);
    
    if (!pageData.query || !pageData.query.pages) {
      console.log('[Wikipedia] No data found');
      process.exit(0);
    }

    const page = Object.values(pageData.query.pages)[0];
    const info = extractRelevantInfo(page);
    
    console.log('\n[Wikipedia] Information:');
    console.log('----------------------');
    console.log(`Title: ${info.title}`);
    console.log('\nDescription:');
    console.log(info.description);

    if (searchType === 'aircraft' && info.specifications) {
      console.log('\nSpecifications:');
      console.log(info.specifications);
    } else if (searchType === 'flight' && info.flightInfo) {
      console.log('\nFlight Information:');
      console.log(info.flightInfo);
    }

    if (info.image) {
      console.log('\nImage URL:');
      console.log(info.image);
    }

    // Log full response for debugging
    console.log('\n[Wikipedia] Full Response:');
    console.log(JSON.stringify(info, null, 2));
  })
  .catch(err => {
    clearTimeout(timeout);
    console.error('[Wikipedia] Error:', err.message);
    process.exit(1);
  }); 