import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import * as L from 'leaflet';
import { TrackPoint } from 'src/app/services/flight/models/track-point.interface';
import { WindowService } from 'src/app/services/window.service';
// TODO: Adapter UserStatusBarComponent import
// TODO: Adapter TranslatePipe import
// TODO: Adapter AuthService import

@Component({
  selector: 'app-preferences',
  standalone: true,
  template: `
    <ion-content id="main-content" class="ion-padding preferences-placeholder">
      <div #mapContainer id="mapContainer"></div>
    </ion-content>
  `,
  styles: [
    `#mapContainer { width: 800px !important; height: 600px !important; min-height: 200px; background: #eee; border: 1px solid #ccc; margin: 40px auto; }`,
    `.preferences-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; text-align: center; }`
  ],
  imports: [CommonModule, IonicModule /*, UserStatusBarComponent, TranslatePipe*/]
})
export class PreferencesPage implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map!: L.Map;
  private marker!: L.Marker;
  private segments: TrackPoint[] = [];
  private polyline?: L.Polyline;

  constructor(private windowService: WindowService) {}

  ngAfterViewInit() {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [46.2382, 6.1089],
      zoom: 8,
      zoomControl: true
    });
    L.tileLayer('https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=rgFTw67zstLijAdZKKVE', {
      attribution: '© MapTiler, OpenStreetMap contributors',
      maxZoom: 20
    }).addTo(this.map);
    setTimeout(() => this.map.invalidateSize(), 200);
    this.marker = L.marker([46.2382, 6.1089]).addTo(this.map).bindPopup('Genève').openPopup();
    L.marker([37.9364, 23.9445]).addTo(this.map).bindPopup('Athènes');

    this.windowService.getSegments().subscribe(segments => {
      console.log('Segments reçus dans Préférences:', segments);
      this.segments = segments;
      if (!segments || segments.length <= 1) {
        alert('Aucune trajectoire à afficher : la liste des segments est vide ou trop courte !');
        // Pour test : forcer un mock si vide
        /*
        const mock: TrackPoint[] = [
          { lat: 46.2382, lon: 6.1089, alt: 0, vel: 0, time: 0 },
          { lat: 37.9364, lon: 23.9445, alt: 0, vel: 0, time: 100 }
        ];
        this.windowService.setSegments(mock);
        */
        return;
      }
      if (this.polyline) {
        this.polyline.remove();
      }
      const latlngs = segments.map(pt => [pt.lat, pt.lon] as [number, number]);
      this.polyline = L.polyline(latlngs, { color: '#1976D2', weight: 4, opacity: 0.9 }).addTo(this.map);
      this.map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50], maxZoom: 8 });
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  async logout() {
    // TODO: Adapter AuthService logout
    // await this.authService.logout();
    window.location.href = '/auth/email';
  }
} 