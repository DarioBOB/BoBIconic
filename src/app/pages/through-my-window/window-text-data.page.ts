import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { WindowService, DynamicData, FlightData } from '../../services/window.service';
import { Subscription } from 'rxjs';
import { TrackPoint } from '../../services/flight/models/track-point.interface';

@Component({
  selector: 'app-window-text-data',
  templateUrl: './window-text-data.page.html',
  styleUrls: ['./window-text-data.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    FormsModule
  ]
})
export class WindowTextDataPage implements OnInit, OnDestroy {
  flightData: FlightData = {
    flightNumber: '',
    airline: '',
    departure: '',
    arrival: '',
    departureTime: '',
    duration: '',
    status: '',
    aircraftType: ''
  };
  dynamicData: DynamicData = {
    altitude: 0,
    speed: 0,
    position: null,
    weather: '',
    estimatedTimeRemaining: ''
  };
  callsign: string = '';
  lastSearchedCallsign: string = '';
  // POIs
  pois: any[] = [];
  segments: TrackPoint[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private windowService: WindowService) {}

  ngOnInit() {
    // S'abonner aux observables du service
    this.subscriptions.push(
      this.windowService.callsign$.subscribe(cs => {
        this.callsign = cs;
      }),
      this.windowService.flightData$.subscribe(data => {
        this.flightData = data;
      }),
      this.windowService.dynamicData$.subscribe(data => {
        this.dynamicData = data;
      }),
      this.windowService.getSegments().subscribe(segments => {
        this.segments = segments;
      })
    );
    // Recherche automatique si callsign déjà présent
    const savedCallsign = this.windowService.getCallsign();
    if (savedCallsign) {
      this.windowService.searchFlight(savedCallsign);
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onCallsignChange(cs: string) {
    this.windowService.searchFlight(cs);
  }

  searchFlight(cs: string) {
    this.windowService.searchFlight(cs);
  }

  copySegmentsCSV() {
    if (!this.segments || this.segments.length === 0) return;
    const header = 'lat,lon,alt,vel,time';
    const rows = this.segments.map(s => `${s.lat},${s.lon},${s.alt},${s.vel},${s.time}`);
    const csv = [header, ...rows].join('\n');
    navigator.clipboard.writeText(csv).then(() => {
      alert('Segments copiés dans le presse-papier !');
    });
  }

  exportSegmentsCSV() {
    if (!this.segments || this.segments.length === 0) return;
    const header = 'lat,lon,alt,vel,time';
    const rows = this.segments.map(s => `${s.lat},${s.lon},${s.alt},${s.vel},${s.time}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'segments.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
} 