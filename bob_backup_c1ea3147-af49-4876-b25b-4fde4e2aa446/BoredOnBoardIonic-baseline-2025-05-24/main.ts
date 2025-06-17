import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from './environments/environment';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { eye, eyeOff, airplaneOutline, carOutline, calendarOutline, chevronDownOutline, chevronUpOutline, personCircleOutline } from 'ionicons/icons';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// Ajout pour Ionicons
addIcons({ eye, 'eye-off': eyeOff, 'airplane-outline': airplaneOutline, 'car-outline': carOutline, 'calendar-outline': calendarOutline, 'chevron-down-outline': chevronDownOutline, 'chevron-up-outline': chevronUpOutline, 'person-circle-outline': personCircleOutline });

registerLocaleData(localeFr, 'fr');

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(HttpClientModule),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    { provide: LOCALE_ID, useFactory: () => localStorage.getItem('lang') || 'en' },
  ],
});
