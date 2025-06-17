import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { FlightSearchComponent } from './pages/flight-search/flight-search.component';
import { FlightTestPage } from './pages/flight-test/flight-test.page';
import { WindowTabsPage } from './pages/window-tabs.page';
import { WindowTextDataPage } from './pages/window-text-data.page';
import { WindowMapPage } from './pages/window-map.page';
import { WindowHublotPage } from './pages/window-hublot.page';

const routes: Routes = [
  { path: '', redirectTo: '/window/map', pathMatch: 'full' },
  { path: 'search', component: FlightSearchComponent },
  { path: 'flight-details/:flightNumber', loadChildren: () => import('./pages/flight-details/flight-details.module').then(m => m.FlightDetailsModule) },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule)
  },
  { path: 'flight-test', component: FlightTestPage },
  {
    path: 'window',
    component: WindowPage
  },
      { path: 'map', component: WindowMapPage },
      { path: 'hublot', component: WindowHublotPage },
      { path: '', redirectTo: 'map', pathMatch: 'full' }
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
