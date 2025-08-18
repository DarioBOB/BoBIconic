export interface Environment {
  production: boolean;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  demoEmail: string;
  demoPassword: string;
  demoUserId: string;
  demoDurationMin: number;
  demoGvaAirport: {
    code: string;
    city: string;
    name: string;
    tz: string;
    lat: number | undefined;
    lon: number | undefined;
  };
  demoAthAirport: {
    code: string;
    city: string;
    name: string;
    tz: string;
    lat: number | undefined;
    lon: number | undefined;
  };
  opensky: {
    username: string;
    password: string;
    baseUrl: string;
    quota: {
      requestsPerHour: number;
      requestsPerSecond: number;
    };
  };
  openskyProxyBaseUrl: string;
  openskyMaxDays: number;
  openskyDefaultSearchDuration: number;
  aviationstack: {
    apiKey: string;
    baseUrl: string;
    plan: string;
    quota: {
      requestsPerMonth: number;
      requestsPerSecond: number;
    };
  };
  fr24ApiBaseUrl: string;
  flightRadar24ApiKey: string;
  defaultLang: string;
  planeAssetPath: string;
  defaultMapCenter: [number, number];
  defaultMapZoom: number;
  staticData: {
    openflights: string;
    ourairports: string;
  };
  openaiApiKey: string;
}

declare global {
  const environment: Environment;
} 