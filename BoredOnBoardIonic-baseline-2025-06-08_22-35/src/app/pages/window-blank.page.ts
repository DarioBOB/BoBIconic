import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { POITableComponent } from '../components/poi-table/poi-table.component';
import { WindowMapTestComponent } from '../components/window-map-test/window-map-test.component';

@Component({
  selector: 'app-window-blank',
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule, POITableComponent, WindowMapTestComponent],
  templateUrl: './window-blank.page.html',
  styleUrls: ['./window-blank.page.scss']
})
export class WindowBlankPage {
  currentDate = new Date();
  // Initialisation à 29%
  realProgress = 29;
  simulatedProgress = 29;
  departureTime: Date;
  arrivalTime: Date;
  segments: any[] = [];
  selectedTab: string = 'infos';

  passengers = [
    {
      name: 'John Doe',
      seat: '12A',
      baggage: ['Valise soute 23kg', 'Cabine 8kg']
    },
    {
      name: 'Jane Smith',
      seat: '12B',
      baggage: ['Valise soute 20kg']
    }
  ];

  constructor() {
    // Calcul initial des heures en fonction de 29%
    const now = new Date();
    const totalDurationMs = 3.25 * 60 * 60 * 1000;
    const elapsedMs = (this.simulatedProgress / 100) * totalDurationMs;
    this.departureTime = new Date(now.getTime() - elapsedMs);
    this.arrivalTime = new Date(this.departureTime.getTime() + totalDurationMs);
    this.generateSegments();
    console.log('DEBUG ▶ segments générés dans WindowBlankPage :', this.segments);
  }

  generateSegments() {
    this.segments = [];
    const startLat = 46.2381; // Genève
    const startLng = 6.1089;
    const endLat = 37.9364; // Athènes
    const endLng = 23.9445;
    const totalDurationMin = 3.25 * 60; // 195 min
    const minAltitude = 0;
    const maxAltitude = 35000; // ft
    const minSpeed = 0;
    const maxSpeed = 850; // km/h
    for (let i = 0; i <= 100; i++) {
      const percent = i;
      const lat = startLat + (endLat - startLat) * (percent / 100);
      const lng = startLng + (endLng - startLng) * (percent / 100);
      let altitude;
      if (percent < 15) altitude = minAltitude + (maxAltitude * percent / 15);
      else if (percent < 85) altitude = maxAltitude;
      else altitude = maxAltitude - (maxAltitude * (percent - 85) / 15);
      let speed;
      if (percent < 10) speed = minSpeed + (maxSpeed * percent / 10);
      else if (percent < 90) speed = maxSpeed;
      else speed = maxSpeed - (maxSpeed * (percent - 90) / 10);
      const elapsedMin = totalDurationMin * (percent / 100);
      const segmentTime = new Date(this.departureTime.getTime() + elapsedMin * 60 * 1000);
      const heure = segmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.segments.push({
        percent,
        lat: +lat.toFixed(4),
        lng: +lng.toFixed(4),
        altitude: Math.round(altitude),
        speed: Math.round(speed),
        elapsedMin: Math.round(elapsedMin),
        heure
      });
    }
  }

  // Méthode appelée lors de la modification du pourcentage simulé
  onSimulatedProgressChange(value: any) {
    const percent = typeof value === 'object' ? (value?.lower ?? value?.upper ?? 0) : value;
    this.simulatedProgress = percent;
    const now = new Date();
    const totalDurationMs = 3.25 * 60 * 60 * 1000;
    const elapsedMs = (percent / 100) * totalDurationMs;
    this.departureTime = new Date(now.getTime() - elapsedMs);
    this.arrivalTime = new Date(this.departureTime.getTime() + totalDurationMs);
    this.generateSegments();
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }
} 