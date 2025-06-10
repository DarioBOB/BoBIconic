import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface POI {
  position: [number, number];
  titleKey: string;
  descriptionKey: string;
  icon: string;
}

@Component({
  selector: 'app-through-my-window',
  standalone: true,
  template: `
    <ion-content>
      <div id="map"></div>
      <div class="progress-container">
        <div class="progress-info">
          <div class="current-position">
            <span class="label">{{ 'WINDOW.PROGRESS.CURRENT_POSITION' | translate }}:</span>
            <span class="value">{{ currentPosition }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress" [style.width.%]="progress"></div>
          </div>
          <div class="progress-details">
            <span class="from">{{ 'WINDOW.POIS.GENEVA.TITLE' | translate }}</span>
            <span class="to">{{ 'WINDOW.POIS.ATHENS.TITLE' | translate }}</span>
          </div>
          <div class="aircraft-coords">
            Coordonnées marker avion : {{ aircraftLat }}, {{ aircraftLng }} (index {{ aircraftIndex }})<br>
            Coordonnées cible 25% : {{ referenceLat }}, {{ referenceLng }} (index {{ referenceIndex }})
          </div>
        </div>
      </div>
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="togglePOIs()">
          <ion-icon [name]="showPOIs ? 'eye-off' : 'eye'"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    #map, .leaflet-container {
      height: calc(100% - 80px) !important;
      width: 100% !important;
      background: #fff !important;
      margin: 0;
      display: block;
    }
    :host {
      display: block;
      height: 100%;
    }
    .progress-container {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(255, 255, 255, 0.95);
      padding: 16px;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    }
    .progress-info {
      max-width: 600px;
      margin: 0 auto;
    }
    .current-position {
      margin-bottom: 8px;
      font-size: 14px;
      color: #666;
    }
    .current-position .label {
      font-weight: 500;
      margin-right: 8px;
    }
    .current-position .value {
      color: #1bb6b1;
      font-weight: 600;
    }
    .progress-bar {
      height: 4px;
      background: #eee;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .progress {
      height: 100%;
      background: #1bb6b1;
      transition: width 0.3s ease;
    }
    .progress-details {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #666;
    }
    .aircraft-coords {
      font-size: 12px;
      color: #b16b1b;
      margin-top: 6px;
    }
  `],
  imports: [CommonModule, IonicModule, TranslateModule]
})
export class ThroughMyWindowPage implements AfterViewInit, OnDestroy {
  private map: L.Map | null = null;
  private planeMarker: L.Marker | null = null;
  private intervalId: any = null;
  private points: [number, number][] = [];
  private poiMarkers: L.Marker[] = [];
  showPOIs = true;
  progress = 25;
  currentPosition = '';
  aircraftLat = 0;
  aircraftLng = 0;
  private referenceMarker: L.Marker | null = null;
  aircraftIndex = 0;
  referenceIndex = 0;
  referenceLat = 0;
  referenceLng = 0;

  private readonly POIs: POI[] = [
    {
      position: [46.2381, 6.1080],
      titleKey: 'WINDOW.POIS.GENEVA.TITLE',
      descriptionKey: 'WINDOW.POIS.GENEVA.DESCRIPTION',
      icon: 'airplane'
    },
    {
      position: [45.4642, 9.1900],
      titleKey: 'WINDOW.POIS.MILAN.TITLE',
      descriptionKey: 'WINDOW.POIS.MILAN.DESCRIPTION',
      icon: 'location'
    },
    {
      position: [41.9028, 12.4964],
      titleKey: 'WINDOW.POIS.ROME.TITLE',
      descriptionKey: 'WINDOW.POIS.ROME.DESCRIPTION',
      icon: 'location'
    },
    {
      position: [37.9364, 23.9445],
      titleKey: 'WINDOW.POIS.ATHENS.TITLE',
      descriptionKey: 'WINDOW.POIS.ATHENS.DESCRIPTION',
      icon: 'airplane'
    }
  ];

  constructor(private translate: TranslateService) {}

  ngAfterViewInit() {
    this.initializeMap();
    this.drawGreatCircle();
    const totalSteps = this.points.length - 1;
    this.referenceIndex = Math.floor(totalSteps * 0.25);
    const refPos = this.points[this.referenceIndex];
    [this.referenceLat, this.referenceLng] = refPos;
    this.referenceMarker = L.marker(refPos, {
      icon: L.icon({
        iconUrl: 'assets/target.png',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      })
    }).addTo(this.map!);
    this.animatePlane();
    this.addPOIs();
  }

  private initializeMap() {
    this.map = L.map('map').setView([44, 15], 6);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri'
    }).addTo(this.map);
    setTimeout(() => this.map?.invalidateSize(), 500);
  }

  private drawGreatCircle() {
    const from = { lat: 46.2381, lon: 6.1080 };
    const to = { lat: 37.9364, lon: 23.9445 };
    const steps = 100;
    const toRad = (d: number) => d * Math.PI / 180;
    const toDeg = (r: number) => r * 180 / Math.PI;
    const lat1 = toRad(from.lat);
    const lon1 = toRad(from.lon);
    const lat2 = toRad(to.lat);
    const lon2 = toRad(to.lon);
    this.points = [];

    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const d = 2 * Math.asin(Math.sqrt(Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2));
      if (d === 0) {
        this.points.push([from.lat, from.lon]);
        continue;
      }
      const A = Math.sin((1 - f) * d) / Math.sin(d);
      const B = Math.sin(f * d) / Math.sin(d);
      const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
      const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
      const z = A * Math.sin(lat1) + B * Math.sin(lat2);
      const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
      const lon = Math.atan2(y, x);
      this.points.push([toDeg(lat), toDeg(lon)]);
    }

    L.polyline(this.points, { color: 'red', weight: 3, dashArray: '8,8' }).addTo(this.map!);
  }

  private getCurrentPositionName(progress: number): string {
    if (progress < 25) {
      return this.translate.instant('WINDOW.POIS.GENEVA.TITLE');
    } else if (progress < 50) {
      return this.translate.instant('WINDOW.PROGRESS.APPROACHING_MILAN');
    } else if (progress < 75) {
      return this.translate.instant('WINDOW.PROGRESS.APPROACHING_ROME');
    } else if (progress < 90) {
      return this.translate.instant('WINDOW.PROGRESS.APPROACHING_ATHENS');
    } else {
      return this.translate.instant('WINDOW.PROGRESS.FINAL_APPROACH');
    }
  }

  private interpolatePosition(points: [number, number][], t: number): [number, number] {
    if (!points || points.length < 2) {
      console.error('[ThroughMyWindow] Tableau de points vide ou insuffisant pour interpolation', points);
      return [0, 0];
    }
    const total = points.length - 1;
    const idx = t * total;
    const idxLow = Math.floor(idx);
    const idxHigh = Math.min(idxLow + 1, total);
    const frac = idx - idxLow;
    const [lat1, lon1] = points[idxLow];
    const [lat2, lon2] = points[idxHigh];
    if (
      isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
    ) {
      console.error('[ThroughMyWindow] NaN détecté dans les points pour interpolation', {lat1, lon1, lat2, lon2, idxLow, idxHigh, t});
      return [0, 0];
    }
    return [lat1 + (lat2 - lat1) * frac, lon1 + (lon2 - lon1) * frac];
  }

  private getAircraftCoordinates(currentIndex: number): [number, number] {
    return this.points[currentIndex];
  }

  private animatePlane() {
    const totalSteps = this.points.length - 1;
    let currentIndex = Math.floor(totalSteps * 0.25); // 25% du trajet
    this.aircraftIndex = currentIndex;
    const updateInterval = 100; // ms
    this.progress = (currentIndex / totalSteps) * 100;
    [this.aircraftLat, this.aircraftLng] = this.points[currentIndex];
    this.currentPosition = this.getCurrentPositionName(this.progress);

    this.intervalId = setInterval(() => {
      if (!this.points || this.points.length < 2) {
        if (this.map) {
          L.popup()
            .setLatLng([44, 15])
            .setContent('Erreur: points de la trajectoire non initialisés.')
            .openOn(this.map);
        }
        clearInterval(this.intervalId);
        return;
      }
      if (this.planeMarker) {
        this.map?.removeLayer(this.planeMarker);
      }
      [this.aircraftLat, this.aircraftLng] = this.points[currentIndex];
      this.aircraftIndex = currentIndex;
      const pos: [number, number] = [this.aircraftLat, this.aircraftLng];
      console.log('[AVION] Index:', currentIndex, 'Coord:', pos, '| [CIBLE] Index:', this.referenceIndex, 'Coord:', [this.referenceLat, this.referenceLng]);
      const next = this.points[Math.min(currentIndex + 1, totalSteps)];
      const getHeading = (a: [number, number], b: [number, number]) => {
        const φ1 = a[0] * Math.PI / 180;
        const φ2 = b[0] * Math.PI / 180;
        const Δλ = (b[1] - a[1]) * Math.PI / 180;
        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        let θ = Math.atan2(y, x) * 180 / Math.PI;
        if (θ < 0) θ += 360;
        return θ;
      };
      const heading = getHeading(pos, next);
      const rounded = Math.round(heading / 15) * 15;
      const normalized = (rounded + 360) % 360;
      const pad = (n: number) => n.toString().padStart(3, '0');
      const planeImagePath = `assets/plane_${pad(normalized)}deg.png`;
      this.planeMarker = L.marker(pos, {
        icon: L.icon({
          iconUrl: planeImagePath,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        })
      }).addTo(this.map!);
      this.progress = (currentIndex / totalSteps) * 100;
      this.currentPosition = this.getCurrentPositionName(this.progress);
      this.map?.panTo(pos);
      if (currentIndex >= totalSteps) {
        clearInterval(this.intervalId);
      } else {
        currentIndex++;
      }
    }, updateInterval);
  }

  private addPOIs() {
    this.POIs.forEach(poi => {
      const marker = L.marker(poi.position, {
        icon: L.icon({
          iconUrl: `assets/${poi.icon}.png`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        })
      }).addTo(this.map!);

      const title = this.translate.instant(poi.titleKey);
      const description = this.translate.instant(poi.descriptionKey);

      marker.bindPopup(`
        <strong>${title}</strong><br>
        ${description}
      `);

      this.poiMarkers.push(marker);
    });
  }

  togglePOIs() {
    this.showPOIs = !this.showPOIs;
    this.poiMarkers.forEach(marker => {
      if (this.showPOIs) {
        marker.addTo(this.map!);
      } else {
        marker.remove();
      }
    });
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    if (this.referenceMarker) {
      this.referenceMarker.remove();
      this.referenceMarker = null;
    }
  }
} 