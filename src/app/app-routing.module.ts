import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { FlightSearchComponent } from './pages/flight-search/flight-search.component';
import { FlightTestPage } from './pages/flight-test/flight-test.page';

const routes: Routes = [
  { path: '', redirectTo: '/landing-tiles', pathMatch: 'full' },
  { path: 'landing-tiles', loadComponent: () => import('./pages/landing-tiles/landing-tiles.page').then(m => m.LandingTilesPage) },
  { path: 'window', loadComponent: () => import('./pages/through-my-window/window.page').then(m => m.WindowPage) },
  { path: 'home', loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage) },
  { path: 'trips', loadComponent: () => import('./pages/trips.page').then(m => m.TripsPage) },
  { path: 'search', component: FlightSearchComponent },
  // { path: 'flight-details/:flightNumber', loadChildren: () => import('./pages/flight-details/flight-details.module').then(m => m.FlightDetailsModule) },
  // { path: 'home', loadChildren: () => import('./home/home.module').then(m => m.HomePageModule) },
  { path: 'flight-test', component: FlightTestPage },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
