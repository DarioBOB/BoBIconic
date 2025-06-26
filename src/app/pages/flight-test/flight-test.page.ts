import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

interface TestFlightData {
  flightNumber: string;
  airline: string;
  codeshares: string[];
  dataSources: {
    aviationstack: string;
    opensky: string;
  };
}

@Component({
  selector: 'app-flight-test',
  templateUrl: './flight-test.page.html',
  styleUrls: ['./flight-test.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FlightTestPage implements OnInit {
  flightData: TestFlightData = {
    flightNumber: '',
    airline: '',
    codeshares: [],
    dataSources: {
      aviationstack: '',
      opensky: ''
    }
  };

  constructor() {}

  ngOnInit() {}
} 