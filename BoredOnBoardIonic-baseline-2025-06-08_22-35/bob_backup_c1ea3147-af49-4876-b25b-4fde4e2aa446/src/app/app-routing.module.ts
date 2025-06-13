import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FlightSearchComponent } from './pages/flight-search/flight-search.component';

const routes: Routes = [
  { path: '', redirectTo: '/search', pathMatch: 'full' },
  { path: 'search', component: FlightSearchComponent },
  { path: 'flight-details/:flightNumber', loadChildren: () => import('./pages/flight-details/flight-details.module').then(m => m.FlightDetailsModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 