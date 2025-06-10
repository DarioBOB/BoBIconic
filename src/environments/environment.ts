// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyBQ876_Ci6AWLBV5-nmkqLDKnCI3929v0E",
    authDomain: "bob-app-9cbfe.firebaseapp.com",
    projectId: "bob-app-9cbfe",
    storageBucket: "bob-app-9cbfe.appspot.com",
    messagingSenderId: "163592997424",
    appId: "1:163592997424:web:ece12127e2e3f07a66bbf5",
    measurementId: "G-EMZ3P925JF"
  },
  zohoPassword: 'HzCXsEafd6PK',
  apiUrl: 'your-api-url',
  flightRadar24ApiKey: 'your-fr24-api-key',
  openaiApiKey: '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',
  
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
  openskyProxyBaseUrl: 'http://localhost:3000/api/opensky/api',
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
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
