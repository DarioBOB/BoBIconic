export const environment = {
  production: true,
  firebase: {
    apiKey: "REMOVED_FOR_SECURITY",
    authDomain: "REMOVED_FOR_SECURITY",
    projectId: "REMOVED_FOR_SECURITY",
    storageBucket: "REMOVED_FOR_SECURITY",
    messagingSenderId: "REMOVED_FOR_SECURITY",
    appId: "REMOVED_FOR_SECURITY",
    measurementId: "REMOVED_FOR_SECURITY"
  },
  zohoPassword: 'REMOVED_FOR_SECURITY',
  apiUrl: 'http://localhost:3000/api',
  flightRadar24ApiKey: 'REMOVED_FOR_SECURITY',
  openaiApiKey: 'REMOVED_FOR_SECURITY',
  
  // Configuration Aviationstack
  aviationstack: {
    apiKey: 'your-aviationstack-api-key',
    baseUrl: 'http://api.aviationstack.com/v1',
    plan: 'free',
    quota: {
      requestsPerMonth: 500,
      requestsPerSecond: 1
    }
  },

  // Configuration OpenSky Network
     opensky: {
     username: 'contact@sunshine-adventures.net',
     password: 'Astaroth001@',
     baseUrl: 'https://opensky-network.org/api',
     quota: {
       requestsPerHour: 400,
       requestsPerSecond: 1
     }
   },

  // Configuration ADS-B Exchange (optionnel)
  adsbexchange: {
    apiKey: 'your-adsbexchange-api-key',
    baseUrl: 'https://adsbexchange-com1.p.rapidapi.com/v2'
  },

  // Données statiques
  staticData: {
    openflights: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat',
    ourairports: 'https://ourairports.com/data/airports.csv'
  },

  // --- Variables centralisées pour configuration dynamique ---
  openskyProxyBaseUrl: 'http://localhost:3000/api/opensky',
  openskyMaxDays: 5,
  openskyDefaultSearchDuration: 3600, // 1h
  demoEmail: 'guestuser@demo.com',
  demoPassword: 'DemoPassword123!',
  demoUserId: 'guest-demo',
  demoDurationMin: 165,
  demoGvaAirport: { code: 'GVA', city: 'Genève', name: 'Aéroport de Genève', tz: 'Europe/Zurich', lat: 46.2381, lon: 6.1089 },
  demoAthAirport: { code: 'ATH', city: 'Athènes', name: 'Aéroport d\'Athènes Elefthérios-Venizélos', tz: 'Europe/Athens', lat: 37.9364, lon: 23.9475 },
  flightawareApiUrl: 'https://aeroapi.flightaware.com/aeroapi',
  flightawareCacheDuration: 5 * 60 * 1000,
  planeAssetPath: 'assets/plane_',
  defaultMapCenter: [44, 15],
  defaultMapZoom: 6,
  defaultLang: 'fr',
  fr24ApiBaseUrl: '',
  unsplash_key: 'METTRE_LA_CLE_UNSPLASH_ICI'
};
