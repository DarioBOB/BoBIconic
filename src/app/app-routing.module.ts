import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { FlightSearchComponent } from './pages/flight-search/flight-search.component';
import { FlightTestPage } from './pages/flight-test/flight-test.page';
import { WindowTabsPage } from './pages/window-tabs.page';

const routes: Routes = [
  { path: '', redirectTo: '/window', pathMatch: 'full' },
  { path: 'search', component: FlightSearchComponent },
  { path: 'flight-details/:flightNumber', loadChildren: () => import('./pages/flight-details/flight-details.module').then(m => m.FlightDetailsModule) },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  { path: 'flight-test', component: FlightTestPage },
  {
    path: 'window',
    component: WindowTabsPage
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
