import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-flight-search',
  templateUrl: './flight-search.component.html',
  styleUrls: ['./flight-search.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FlightSearchComponent implements OnInit {
  flightNumber: string = '';
  date: string = '';
  error: string | null = null;

  constructor() {}

  ngOnInit() {}

  searchFlight() {
    if (!this.flightNumber) {
      this.error = 'Veuillez entrer un numéro de vol';
      return;
    }
    if (!this.date) {
      this.error = 'Veuillez sélectionner une date';
      return;
    }
    this.error = null;
    console.log('Recherche du vol:', this.flightNumber, 'pour la date:', this.date);
  }
} 