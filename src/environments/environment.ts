// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
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
    apiKey: 'a676049e930083b70afb8176af94b4c0',
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
  fr24ApiBaseUrl: 'http://192.168.68.56:5001'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
