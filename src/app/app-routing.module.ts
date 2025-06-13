import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { FlightSearchComponent } from './pages/flight-search/flight-search.component';
import { FlightTestPage } from './pages/flight-test/flight-test.page';

const routes: Routes = [
  { path: '', redirectTo: '/window', pathMatch: 'full' },
  { path: 'search', component: FlightSearchComponent },
  // { path: 'flight-details/:flightNumber', loadChildren: () => import('./pages/flight-details/flight-details.module').then(m => m.FlightDetailsModule) },
  // { path: 'home', loadChildren: () => import('./home/home.module').then(m => m.HomePageModule) },
  { path: 'flight-test', component: FlightTestPage },
  {
    path: 'window',
    loadComponent: () => import('./pages/through-my-window/window-tabs.page').then(m => m.WindowTabsPage),
    children: [
      {
        path: 'flightData',
        loadComponent: () => import('./pages/through-my-window/window-text-data.page').then(m => m.WindowTextDataPage)
      },
      {
        path: 'map',
        loadComponent: () => import('./pages/through-my-window/window-map.page').then(m => m.WindowMapPage)
      },
      {
        path: 'hublot',
        loadComponent: () => import('./pages/through-my-window/window-hublot.page').then(m => m.WindowHublotPage)
      },
      {
        path: '',
        redirectTo: 'flightData',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
