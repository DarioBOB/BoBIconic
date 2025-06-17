import { Routes } from '@angular/router';
import { FlightSearchComponent } from './pages/flight-search/flight-search.component';
import { FlightTestPage } from './pages/flight-test/flight-test.page';
import { WindowPage } from './pages/through-my-window/window.page';

export const routes: Routes = [
  { path: '', redirectTo: '/window', pathMatch: 'full' },
  { path: 'search', component: FlightSearchComponent },
  { path: 'flight-test', component: FlightTestPage },
  {
    path: 'window',
    component: WindowPage
  }
];
