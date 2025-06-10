-- Schéma de la base de données aviation.db

-- Table des aéroports (fusion OpenFlights + OurAirports)
CREATE TABLE IF NOT EXISTS airports (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    city TEXT,
    country TEXT,
    iata TEXT,
    icao TEXT,
    latitude REAL,
    longitude REAL,
    altitude INTEGER,
    timezone TEXT,
    dst TEXT,
    tz_database_timezone TEXT,
    type TEXT,
    source TEXT,
    elevation_ft INTEGER,
    continent TEXT,
    iso_country TEXT,
    iso_region TEXT,
    municipality TEXT,
    scheduled_service TEXT,
    gps_code TEXT,
    local_code TEXT,
    home_link TEXT,
    wikipedia_link TEXT,
    keywords TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des compagnies aériennes
CREATE TABLE IF NOT EXISTS airlines (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    alias TEXT,
    iata TEXT,
    icao TEXT,
    callsign TEXT,
    country TEXT,
    active TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des routes
CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY,
    airline_id INTEGER,
    source_airport_id INTEGER,
    dest_airport_id INTEGER,
    codeshare TEXT,
    stops INTEGER,
    equipment TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (airline_id) REFERENCES airlines(id),
    FOREIGN KEY (source_airport_id) REFERENCES airports(id),
    FOREIGN KEY (dest_airport_id) REFERENCES airports(id)
);

-- Table des pistes
CREATE TABLE IF NOT EXISTS runways (
    id INTEGER PRIMARY KEY,
    airport_id INTEGER,
    length_ft INTEGER,
    width_ft INTEGER,
    surface TEXT,
    lighted INTEGER,
    closed INTEGER,
    le_ident TEXT,
    le_latitude REAL,
    le_longitude REAL,
    le_elevation_ft INTEGER,
    le_heading_deg REAL,
    le_displaced_threshold_ft INTEGER,
    he_ident TEXT,
    he_latitude REAL,
    he_longitude REAL,
    he_elevation_ft INTEGER,
    he_heading_deg REAL,
    he_displaced_threshold_ft INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (airport_id) REFERENCES airports(id)
);

-- Table des fréquences radio
CREATE TABLE IF NOT EXISTS frequencies (
    id INTEGER PRIMARY KEY,
    airport_id INTEGER,
    type TEXT,
    description TEXT,
    frequency_mhz REAL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (airport_id) REFERENCES airports(id)
);

-- Table des avions
CREATE TABLE IF NOT EXISTS aircraft (
    id INTEGER PRIMARY KEY,
    icao24 TEXT UNIQUE,
    registration TEXT,
    type_code TEXT,
    manufacturer TEXT,
    model TEXT,
    owner TEXT,
    operator TEXT,
    built INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des enrichissements Wikipedia
CREATE TABLE IF NOT EXISTS wikipedia_enrichments (
    id INTEGER PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'airport', 'airline', 'aircraft'
    entity_id INTEGER NOT NULL, -- ID de l'entité enrichie
    title TEXT,
    description TEXT,
    image_url TEXT,
    wikipedia_url TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata);
CREATE INDEX IF NOT EXISTS idx_airports_icao ON airports(icao);
CREATE INDEX IF NOT EXISTS idx_airlines_iata ON airlines(iata);
CREATE INDEX IF NOT EXISTS idx_airlines_icao ON airlines(icao);
CREATE INDEX IF NOT EXISTS idx_aircraft_icao24 ON aircraft(icao24);
CREATE INDEX IF NOT EXISTS idx_aircraft_registration ON aircraft(registration);
CREATE INDEX IF NOT EXISTS idx_routes_airline ON routes(airline_id);
CREATE INDEX IF NOT EXISTS idx_routes_airports ON routes(source_airport_id, dest_airport_id); 