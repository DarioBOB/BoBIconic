'use strict';

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Configuration
const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(__dirname, '../database/aviation.db');
const OPENFLIGHTS_URLS = {
  airports: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat',
  airlines: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat',
  routes: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat'
};
const OURAIRPORTS_URLS = {
  airports: 'https://davidmegginson.github.io/ourairports-data/airports.csv',
  runways: 'https://davidmegginson.github.io/ourairports-data/runways.csv',
  frequencies: 'https://davidmegginson.github.io/ourairports-data/frequencies.csv'
};

// Créer les répertoires nécessaires
function createDirectories() {
  const dirs = [
    DATA_DIR,
    path.join(DATA_DIR, 'openflights'),
    path.join(DATA_DIR, 'ourairports'),
    path.join(__dirname, '../database')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Télécharger un fichier
async function downloadFile(url, destination) {
  console.log(`Téléchargement de ${url}...`);
  const response = await axios.get(url);
  await writeFile(destination, response.data);
  console.log(`Téléchargé dans ${destination}`);
}

// Télécharger tous les fichiers statiques
async function downloadStaticData() {
  // OpenFlights
  for (const [name, url] of Object.entries(OPENFLIGHTS_URLS)) {
    const dest = path.join(DATA_DIR, 'openflights', `${name}.dat`);
    await downloadFile(url, dest);
  }

  // OurAirports
  for (const [name, url] of Object.entries(OURAIRPORTS_URLS)) {
    const dest = path.join(DATA_DIR, 'ourairports', `${name}.csv`);
    await downloadFile(url, dest);
  }
}

// Initialiser la base de données
async function initDatabase() {
  console.log('Initialisation de la base de données...');
  
  // Créer la base de données
  const db = new sqlite3.Database(DB_PATH);
  
  // Lire et exécuter le schéma SQL
  const schema = await readFile(path.join(__dirname, '../database/schema.sql'), 'utf8');
  await new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  console.log('Base de données initialisée avec succès');
  return db;
}

// Parser les données OpenFlights
function parseOpenFlightsData(data, type) {
  const lines = data.split('\n');
  return lines.map(line => {
    const fields = line.split(',').map(field => field.replace(/^"|"$/g, ''));
    switch (type) {
      case 'airports':
        return {
          name: fields[1],
          city: fields[2],
          country: fields[3],
          iata: fields[4],
          icao: fields[5],
          latitude: parseFloat(fields[6]),
          longitude: parseFloat(fields[7]),
          altitude: parseInt(fields[8], 10),
          timezone: fields[9],
          dst: fields[10],
          tz_database_timezone: fields[11],
          type: fields[12],
          source: 'openflights'
        };
      case 'airlines':
        return {
          name: fields[1],
          alias: fields[2],
          iata: fields[3],
          icao: fields[4],
          callsign: fields[5],
          country: fields[6],
          active: fields[7]
        };
      case 'routes':
        return {
          airline_id: parseInt(fields[0], 10),
          source_airport_id: parseInt(fields[1], 10),
          dest_airport_id: parseInt(fields[2], 10),
          codeshare: fields[3],
          stops: parseInt(fields[4], 10),
          equipment: fields[5]
        };
      default:
        return null;
    }
  }).filter(item => item !== null);
}

// Parser les données OurAirports
function parseOurAirportsData(data, type) {
  const lines = data.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const fields = line.split(',').map(field => field.replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = fields[index];
    });
    return row;
  });
}

// Importer les données dans la base de données
async function importData(db) {
  console.log('Import des données...');

  // Importer les aéroports OpenFlights
  const airportsData = await readFile(path.join(DATA_DIR, 'openflights', 'airports.dat'), 'utf8');
  const airports = parseOpenFlightsData(airportsData, 'airports');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO airports (
      name, city, country, iata, icao, latitude, longitude, altitude,
      timezone, dst, tz_database_timezone, type, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const airport of airports) {
    stmt.run(
      airport.name, airport.city, airport.country, airport.iata, airport.icao,
      airport.latitude, airport.longitude, airport.altitude, airport.timezone,
      airport.dst, airport.tz_database_timezone, airport.type, airport.source
    );
  }
  stmt.finalize();
  console.log(`${airports.length} aéroports importés depuis OpenFlights`);

  // Importer les données OurAirports
  const ourAirportsData = await readFile(path.join(DATA_DIR, 'ourairports', 'airports.csv'), 'utf8');
  const ourAirports = parseOurAirportsData(ourAirportsData, 'airports');
  
  const updateStmt = db.prepare(`
    UPDATE airports SET
      elevation_ft = ?,
      continent = ?,
      iso_country = ?,
      iso_region = ?,
      municipality = ?,
      scheduled_service = ?,
      gps_code = ?,
      local_code = ?,
      home_link = ?,
      wikipedia_link = ?,
      keywords = ?
    WHERE icao = ?
  `);

  for (const airport of ourAirports) {
    if (airport.icao) {
      updateStmt.run(
        airport.elevation_ft,
        airport.continent,
        airport.iso_country,
        airport.iso_region,
        airport.municipality,
        airport.scheduled_service,
        airport.gps_code,
        airport.local_code,
        airport.home_link,
        airport.wikipedia_link,
        airport.keywords,
        airport.icao
      );
    }
  }
  updateStmt.finalize();
  console.log(`${ourAirports.length} aéroports enrichis depuis OurAirports`);

  // Importer les compagnies aériennes
  const airlinesData = await readFile(path.join(DATA_DIR, 'openflights', 'airlines.dat'), 'utf8');
  const airlines = parseOpenFlightsData(airlinesData, 'airlines');
  
  const airlineStmt = db.prepare(`
    INSERT OR REPLACE INTO airlines (
      name, alias, iata, icao, callsign, country, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const airline of airlines) {
    airlineStmt.run(
      airline.name, airline.alias, airline.iata, airline.icao,
      airline.callsign, airline.country, airline.active
    );
  }
  airlineStmt.finalize();
  console.log(`${airlines.length} compagnies aériennes importées`);

  // Importer les routes
  const routesData = await readFile(path.join(DATA_DIR, 'openflights', 'routes.dat'), 'utf8');
  const routes = parseOpenFlightsData(routesData, 'routes');
  
  const routeStmt = db.prepare(`
    INSERT OR REPLACE INTO routes (
      airline_id, source_airport_id, dest_airport_id,
      codeshare, stops, equipment
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const route of routes) {
    routeStmt.run(
      route.airline_id, route.source_airport_id, route.dest_airport_id,
      route.codeshare, route.stops, route.equipment
    );
  }
  routeStmt.finalize();
  console.log(`${routes.length} routes importées`);

  // Importer les pistes
  const runwaysData = await readFile(path.join(DATA_DIR, 'ourairports', 'runways.csv'), 'utf8');
  const runways = parseOurAirportsData(runwaysData, 'runways');
  
  const runwayStmt = db.prepare(`
    INSERT OR REPLACE INTO runways (
      airport_id, length_ft, width_ft, surface, lighted, closed,
      le_ident, le_latitude, le_longitude, le_elevation_ft,
      le_heading_deg, le_displaced_threshold_ft,
      he_ident, he_latitude, he_longitude, he_elevation_ft,
      he_heading_deg, he_displaced_threshold_ft
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const runway of runways) {
    const airportId = await getAirportIdByIcao(db, runway.airport_ident);
    if (airportId) {
      runwayStmt.run(
        airportId,
        runway.length_ft,
        runway.width_ft,
        runway.surface,
        runway.lighted,
        runway.closed,
        runway.le_ident,
        runway.le_latitude,
        runway.le_longitude,
        runway.le_elevation_ft,
        runway.le_heading_deg,
        runway.le_displaced_threshold_ft,
        runway.he_ident,
        runway.he_latitude,
        runway.he_longitude,
        runway.he_elevation_ft,
        runway.he_heading_deg,
        runway.he_displaced_threshold_ft
      );
    }
  }
  runwayStmt.finalize();
  console.log(`${runways.length} pistes importées`);

  // Importer les fréquences
  const frequenciesData = await readFile(path.join(DATA_DIR, 'ourairports', 'frequencies.csv'), 'utf8');
  const frequencies = parseOurAirportsData(frequenciesData, 'frequencies');
  
  const frequencyStmt = db.prepare(`
    INSERT OR REPLACE INTO frequencies (
      airport_id, type, description, frequency_mhz
    ) VALUES (?, ?, ?, ?)
  `);

  for (const frequency of frequencies) {
    const airportId = await getAirportIdByIcao(db, frequency.airport_ident);
    if (airportId) {
      frequencyStmt.run(
        airportId,
        frequency.type,
        frequency.description,
        frequency.frequency_mhz
      );
    }
  }
  frequencyStmt.finalize();
  console.log(`${frequencies.length} fréquences importées`);
}

// Fonction utilitaire pour obtenir l'ID d'un aéroport par son code ICAO
async function getAirportIdByIcao(db, icao) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM airports WHERE icao = ?', [icao], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.id : null);
    });
  });
}

// Fonction principale
async function main() {
  try {
    console.log('Démarrage de l\'initialisation...');
    
    // Créer les répertoires
    createDirectories();
    
    // Télécharger les données statiques
    await downloadStaticData();
    
    // Initialiser la base de données
    const db = await initDatabase();
    
    // Importer les données
    await importData(db);
    
    // Fermer la base de données
    db.close();
    
    console.log('Initialisation terminée avec succès !');
    process.exit(0);
  } catch (err) {
    console.error('Erreur lors de l\'initialisation:', err);
    process.exit(1);
  }
}

// Exécuter le script
main(); 