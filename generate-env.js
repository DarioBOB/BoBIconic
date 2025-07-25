const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const env = process.env;

const content = `export const environment = {
  production: false,
  firebase: {
    apiKey: "${env.FIREBASE_API_KEY}",
    authDomain: "${env.FIREBASE_AUTH_DOMAIN}",
    projectId: "${env.FIREBASE_PROJECT_ID}",
    storageBucket: "${env.FIREBASE_STORAGE_BUCKET}",
    messagingSenderId: "${env.FIREBASE_MESSAGING_SENDER_ID}",
    appId: "${env.FIREBASE_APP_ID}",
    measurementId: "${env.FIREBASE_MEASUREMENT_ID}"
  },
  demoEmail: "${env.DEMO_EMAIL}",
  demoPassword: "${env.DEMO_PASSWORD}",
  demoUserId: "${env.DEMO_USER_ID}",
  demoDurationMin: ${env.DEMO_DURATION_MIN || 165},
  demoGvaAirport: {
    code: "${env.DEMO_GVA_CODE}",
    city: "${env.DEMO_GVA_CITY}",
    name: "${env.DEMO_GVA_NAME}",
    tz: "${env.DEMO_GVA_TZ}",
    lat: ${env.DEMO_GVA_LAT},
    lon: ${env.DEMO_GVA_LON}
  },
  demoAthAirport: {
    code: "${env.DEMO_ATH_CODE}",
    city: "${env.DEMO_ATH_CITY}",
    name: "${env.DEMO_ATH_NAME}",
    tz: "${env.DEMO_ATH_TZ}",
    lat: ${env.DEMO_ATH_LAT},
    lon: ${env.DEMO_ATH_LON}
  },
  opensky: {
    username: "${env.OPENSKY_USERNAME}",
    password: "${env.OPENSKY_PASSWORD}",
    baseUrl: "${env.OPENSKY_BASE_URL}",
    quota: {
      requestsPerHour: 400,
      requestsPerSecond: 1
    }
  },
  openskyProxyBaseUrl: "${env.OPENSKY_PROXY_BASE_URL}",
  openskyMaxDays: ${env.OPENSKY_MAX_DAYS || 5},
  openskyDefaultSearchDuration: ${env.OPENSKY_DEFAULT_SEARCH_DURATION || 3600},
  aviationstack: {
    apiKey: "${env.AVIATIONSTACK_API_KEY}",
    baseUrl: "${env.AVIATIONSTACK_BASE_URL}",
    plan: "${env.AVIATIONSTACK_PLAN}",
    quota: {
      requestsPerMonth: ${env.AVIATIONSTACK_REQUESTS_PER_MONTH || 500},
      requestsPerSecond: ${env.AVIATIONSTACK_REQUESTS_PER_SECOND || 1}
    }
  },
  fr24ApiBaseUrl: "${env.FR24_API_BASE_URL}",
  flightRadar24ApiKey: "${env.FLIGHTRADAR24_API_KEY}",
  defaultLang: "${env.DEFAULT_LANG || 'fr'}",
  planeAssetPath: "${env.PLANE_ASSET_PATH || 'assets/plane_'}",
  defaultMapCenter: [${env.DEFAULT_MAP_CENTER || '44,15'}],
  defaultMapZoom: ${env.DEFAULT_MAP_ZOOM || 6},
  staticData: {
    openflights: "${env.OPENFLIGHTS_URL}",
    ourairports: "${env.OURAIRPORTS_URL}"
  }
};
`;

fs.writeFileSync('src/environments/environment.ts', content);
fs.writeFileSync('src/environments/environment.prod.ts', content);
console.log('Environnements générés à partir de .env'); 