import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FlightSearchComponent } from './flight-search.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [FlightSearchComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: FlightSearchComponent
      }
    ])
  ]
})
export class FlightSearchModule { } 