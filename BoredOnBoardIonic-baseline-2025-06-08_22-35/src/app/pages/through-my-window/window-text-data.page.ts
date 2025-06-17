import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { WindowService } from '../../services/window.service';
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
    TranslateModule
  ]
})
export class WindowTextDataPage implements OnInit, OnDestroy {
  flightData = this.windowService.flightData.value;
  dynamicData = this.windowService.dynamicData.value;

  // POIs
  pois: any[] = [];

  segments: TrackPoint[] = [];

  private subscriptions: Subscription[] = [];

  constructor(private windowService: WindowService) {}

  ngOnInit() {
    // S'abonner aux observables du service
    this.subscriptions.push(
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
  }

  ngOnDestroy() {
    // Nettoyer les abonnements
    this.subscriptions.forEach(sub => sub.unsubscribe());
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