import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FlightDetailsComponent } from './components/flight-details/flight-details.component';

@NgModule({
  declarations: [
    FlightDetailsComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    FlightDetailsComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TravelModule { } 