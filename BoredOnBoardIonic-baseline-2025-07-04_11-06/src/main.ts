import { enableProdMode, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app/app.routes';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

// Ajout Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';
import { IonicStorageModule } from '@ionic/storage-angular';

addIcons({
  'home': allIcons.home,
  'person-circle-outline': allIcons.personCircleOutline,
  'settings-outline': allIcons.settingsOutline,
  'shield-checkmark-outline': allIcons.shieldCheckmarkOutline,
  'document-text-outline': allIcons.documentTextOutline,
  'people-outline': allIcons.peopleOutline,
  'analytics-outline': allIcons.analyticsOutline,
  'airplane': allIcons.airplane,
  'refresh-outline': allIcons.refreshOutline,
  'add': allIcons.add,
  'refresh-circle': allIcons.refreshCircle,
  'calendar': allIcons.calendar,
  'time': allIcons.time,
  'stats-chart': allIcons.statsChart,
  'alert-circle': allIcons.alertCircle,
  'airplane-outline': allIcons.airplaneOutline,
  'calendar-outline': allIcons.calendarOutline,
  'time-outline': allIcons.timeOutline,
  'star': allIcons.star,
  'location': allIcons.location,
  'list': allIcons.list,
  'people': allIcons.people,
  'share-outline': allIcons.shareOutline,
  'create-outline': allIcons.createOutline,
  'ellipsis-vertical': allIcons.ellipsisVertical,
  'chevron-down': allIcons.chevronDown,
  'add-circle-outline': allIcons.addCircleOutline,
  'information-circle': allIcons.informationCircle,
  'help-circle': allIcons.helpCircle,
  'settings': allIcons.settings,
  'play-outline': allIcons.playOutline,
  'pause-outline': allIcons.pauseOutline,
  'stats-chart-outline': allIcons.statsChartOutline,
  'filter-outline': allIcons.filterOutline,
  'map': allIcons.map,
  'chatbubbles': allIcons.chatbubbles,
  'game-controller': allIcons.gameController,
  'notifications': allIcons.notifications,
  'document': allIcons.document,
  'log-out-outline': allIcons.logOutOutline,
});

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

registerLocaleData(localeFr, 'fr');

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    importProvidersFrom(
      HttpClientModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      }),
      IonicStorageModule.forRoot()
    ),
  ],
});
