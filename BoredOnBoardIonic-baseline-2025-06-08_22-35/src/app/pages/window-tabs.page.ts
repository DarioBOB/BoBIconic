import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WindowMapTestComponent } from './window-map-test.component';
import { WindowHublotComponent } from '../components/window-hublot.component';
import { POITableComponent } from '../components/poi-table/poi-table.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FlightEnrichmentService } from '../services/flight/flight-enrichment.service';
import { TrackPoint } from '../services/flight/models/track-point.interface';
import { MiniMapComponent } from '../components/mini-map/mini-map.component';

const EARTH_RADIUS_KM = 6371;
const M_PER_DEG_LAT = 111320.0;

function horizonDistance(altitudeM: number): number {
  const H = altitudeM / 1000.0;
  const dKm = Math.sqrt((EARTH_RADIUS_KM + H) ** 2 - EARTH_RADIUS_KM ** 2);
  return dKm * 1000.0;
}

function computeHublotBounds(latC: number, lonC: number, altitudeM: number) {
  const d = horizonDistance(altitudeM);
  const dLatDeg = d / M_PER_DEG_LAT;
  const latRad = latC * Math.PI / 180.0;
  const metersPerDegLon = M_PER_DEG_LAT * Math.cos(latRad);
  const dLonDeg = d / metersPerDegLon;
  const southWest: [number, number] = [latC - dLatDeg, lonC - dLonDeg];
  const northEast: [number, number] = [latC + dLatDeg, lonC + dLonDeg];
  return { southWest, northEast };
}

function computeOffsetHublotBounds(
  latC: number,
  lonC: number,
  altitudeM: number,
  trackDeg: number,
  offsetDeg: number
) {
  const d = horizonDistance(altitudeM);
  const directionRad = ((trackDeg + offsetDeg) * Math.PI) / 180.0;
  const dCenter = d / 2;
  const latOffset = (dCenter / M_PER_DEG_LAT) * Math.cos(directionRad);
  const latRad = latC * Math.PI / 180.0;
  const metersPerDegLon = M_PER_DEG_LAT * Math.cos(latRad);
  const lonOffset = (dCenter / metersPerDegLon) * Math.sin(directionRad);
  const latHublot = latC + latOffset;
  const lonHublot = lonC + lonOffset;
  const dLatDeg = d / M_PER_DEG_LAT / 2;
  const dLonDeg = d / (2 * metersPerDegLon);
  const southWest: [number, number] = [latHublot - dLatDeg, lonHublot - dLonDeg];
  const northEast: [number, number] = [latHublot + dLatDeg, lonHublot + dLonDeg];
  return { southWest, northEast };
}

function getTrackDeg(startLat: number, startLng: number, endLat: number, endLng: number): number {
  // Calcul du cap initial (great circle) entre deux points
  const toRad = (deg: number) => deg * Math.PI / 180;
  const toDeg = (rad: number) => rad * 180 / Math.PI;
  const dLon = toRad(endLng - startLng);
  const lat1 = toRad(startLat);
  const lat2 = toRad(endLat);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  let brng = Math.atan2(y, x);
  brng = toDeg(brng);
  return (brng + 360) % 360;
}

function computeLeafletZoom(
  bounds: { southWest: [number, number]; northEast: [number, number] },
  mapWidthPx: number,
  mapHeightPx: number
): number {
  // Approximation pour un monde Web Mercator (Leaflet)
  const WORLD_DIM = { width: 256, height: 256 };
  const ZOOM_MAX = 18;

  function latRad(lat: number) {
    const sin = Math.sin((lat * Math.PI) / 180);
    return Math.log((1 + sin) / (1 - sin)) / 2;
  }

  function zoom(mapPx: number, worldPx: number, fraction: number) {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }

  const ne = bounds.northEast;
  const sw = bounds.southWest;

  const latFraction = (latRad(ne[0]) - latRad(sw[0])) / Math.PI;
  const lngDiff = ne[1] - sw[1];
  const lngFraction = ((lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360);

  const latZoom = zoom(mapHeightPx, WORLD_DIM.height, latFraction);
  const lngZoom = zoom(mapWidthPx, WORLD_DIM.width, lngFraction);

  return Math.min(latZoom, lngZoom, ZOOM_MAX);
}

function classifyFlightPhases(segments: any[]): void {
  if (segments.length === 0) return;
  const N = segments.length;
  const altitudes = segments.map(s => s.altitude);
  // Indices fixes pour la démo : montée jusqu'à 20%, croisière 20-80%, descente après 80%
  const i_climb_end = Math.round(N * 0.2);
  const i_cruise_start = i_climb_end;
  const i_cruise_end = Math.round(N * 0.8);
  const i_descent_start = i_cruise_end + 1;

  // Détection taxi départ/arrivée (si altitude = 0)
  let i_surf_takeoff = 0;
  while (i_surf_takeoff < N && altitudes[i_surf_takeoff] <= 0) i_surf_takeoff++;
  let i_surf_landing = N - 1;
  while (i_surf_landing >= 0 && altitudes[i_surf_landing] <= 0) i_surf_landing--;

  // Toujours marquer le tout premier segment comme TAXI_DEPART
  segments[0].phase = "TAXI_DEPART";
  for (let i = 1; i < N; i++) {
    if (i < i_surf_takeoff) {
      segments[i].phase = "TAXI_DEPART";
    } else if (i < i_climb_end) {
      segments[i].phase = "CLIMB";
    } else if (i >= i_cruise_start && i <= i_cruise_end) {
      segments[i].phase = "CRUISE";
    } else if (i > i_cruise_end && i <= i_surf_landing) {
      segments[i].phase = "DESCENT";
    } else {
      segments[i].phase = "TAXI_ARRIVEE";
    }
  }
}

@Component({
  selector: 'app-window-tabs',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, WindowMapTestComponent, WindowHublotComponent, POITableComponent, MiniMapComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Ma Fenêtre</ion-title>
      </ion-toolbar>
    </ion-header>

    <div *ngIf="isLoadingData" class="spinner-container">
      <ion-spinner name="crescent"></ion-spinner>
      <div>Chargement des données de vol…</div>
    </div>

    <div *ngIf="!isLoadingData">
      <div class="fixed-slider">
        <div class="progress-bar-container">
          <ion-item lines="none">
            <ion-label position="stacked">Progression du vol</ion-label>
            <div class="progress-info">
              <span>Réel : {{ realProgress }}%</span>
              <span>Simulé : {{ simulatedProgress }}%</span>
            </div>
            <ion-range min="0" max="100" step="1" [(ngModel)]="simulatedProgress" (ionChange)="onSimulatedProgressChange($event.detail.value)">
              <ion-label slot="start">0%</ion-label>
              <ion-label slot="end">100%</ion-label>
            </ion-range>
          </ion-item>
        </div>

        <!-- Onglets maison -->
        <div class="custom-tabs">
          <button [class.active]="selectedTab === 'infos'" (click)="selectTab('infos')">Données vol</button>
          <button [class.active]="selectedTab === 'map'" (click)="selectTab('map')">Carte</button>
          <button [class.active]="selectedTab === 'hublot'" (click)="selectTab('hublot')">Hublot</button>
        </div>
      </div>

      <ion-content [scrollY]="true" class="content-with-fixed-slider">
        <!-- Contenu conditionnel -->
        <div *ngIf="selectedTab === 'infos'" class="ion-padding">
          <h2>Données textuelles sur le vol</h2>
          <ion-card>
            <ion-card-header>
              <ion-card-title>Données générales du vol</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p><strong>Numéro de vol :</strong> LX 4334 (démo)</p>
              <p><strong>Compagnie :</strong> Swiss International Air Lines</p>
              <p><strong>Départ :</strong> Genève (GVA)</p>
              <p><strong>Arrivée :</strong> Athènes (ATH)</p>
              <p><strong>Date de départ :</strong> {{ departureTime | date:'EEE dd MMM yyyy' }}</p>
              <p><strong>Heure de départ :</strong> {{ departureTime | date:'HH:mm' }}</p>
              <p><strong>Heure d'arrivée :</strong> {{ arrivalTime | date:'HH:mm' }}</p>
              <p><strong>Durée :</strong> 3h 15min</p>
              <p><strong>Statut :</strong> À l'heure</p>
              <p><strong>Type d'avion :</strong> Airbus A320</p>
            </ion-card-content>
          </ion-card>
          <ion-card>
            <ion-card-header>
              <ion-card-title>Données dynamiques de vol</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p><strong>Altitude :</strong> {{ currentSegment?.altitude }} ft</p>
              <p><strong>Vitesse :</strong> {{ currentSegment?.speed }} km/h</p>
              <p><strong>Position :</strong> {{ currentSegment?.lat }}°N, {{ currentSegment?.lng }}°E</p>
              <p><strong>Phase :</strong> {{ currentSegment?.phase }}</p>
              <p><strong>Météo :</strong> Ensoleillé</p>
              <p><strong>Temps restant :</strong> {{ remainingTime }} min</p>
            </ion-card-content>
          </ion-card>
          <ion-card>
            <ion-card-header>
              <ion-card-title>POIs (Points d'intérêt)</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p><strong>Villes survolées :</strong> Milan, Rome, Naples</p>
              <p><strong>Monuments :</strong> Colisée, Acropole</p>
              <p><strong>Reliefs :</strong> Alpes, Apennins</p>
            </ion-card-content>
          </ion-card>
          <ion-card>
            <ion-card-header>
              <ion-card-title>Segments de vol (1% chacun)</ion-card-title>
            </ion-card-header>
            <div style="display: flex; justify-content: flex-end; gap: 8px; margin: 8px 0;">
              <ion-button size="small" (click)="copySegmentsCSV()">Copier CSV</ion-button>
              <ion-button size="small" (click)="exportSegmentsCSV()">Exporter CSV</ion-button>
            </div>
            <ng-container *ngIf="isRealData && realFlightInfo; else simulatedNote">
              <div style="margin-bottom:8px; color:#1976d2; font-weight:bold;">
                Données réelles issues de l'API {{ realFlightInfo.api }}<br>
                Vol : <b>{{ realFlightInfo.callsign }}</b> | Départ : <b>{{ realFlightInfo.departureTime | date:'EEE dd MMM yyyy HH:mm' }}</b>
              </div>
            </ng-container>
            <ng-template #simulatedNote>
              <div style="margin-bottom:8px; color:#d32f2f; font-weight:bold;">
                Données simulées (aucune donnée réelle disponible)
              </div>
            </ng-template>
            <ion-card-content>
              <div class="table-container">
                <table class="segments-table">
                  <thead>
                    <tr>
                      <th>%</th>
                      <th>Lat</th>
                      <th>Lng</th>
                      <th>Altitude (ft)</th>
                      <th>Vitesse (km/h)</th>
                      <th>Temps écoulé (min)</th>
                      <th>Heure</th>
                      <th>Phase</th>
                      <th>Hublot G (SW/NE)</th>
                      <th>Zoom G</th>
                      <th>Hublot D (SW/NE)</th>
                      <th>Zoom D</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let seg of segments" [class.active-segment]="seg.percent === simulatedProgress">
                      <td>{{ seg.percent }}</td>
                      <td>{{ seg?.lat }}</td>
                      <td>{{ seg?.lng }}</td>
                      <td>{{ seg?.altitude }}</td>
                      <td>{{ seg?.speed }}</td>
                      <td>{{ seg?.elapsedMin }}</td>
                      <td>{{ seg?.heure }}</td>
                      <td>{{ seg?.phase }}</td>
                      <td style="font-size:0.8em">{{ seg?.boundsLeft.southWest[0] | number:'1.4-4' }},{{ seg?.boundsLeft.southWest[1] | number:'1.4-4' }}<br>{{ seg?.boundsLeft.northEast[0] | number:'1.4-4' }},{{ seg?.boundsLeft.northEast[1] | number:'1.4-4' }}</td>
                      <td>{{ seg?.zoomLeft }}</td>
                      <td style="font-size:0.8em">{{ seg?.boundsRight.southWest[0] | number:'1.4-4' }},{{ seg?.boundsRight.southWest[1] | number:'1.4-4' }}<br>{{ seg?.boundsRight.northEast[0] | number:'1.4-4' }},{{ seg?.boundsRight.northEast[1] | number:'1.4-4' }}</td>
                      <td>{{ seg?.zoomRight }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <div *ngIf="selectedTab === 'map'" class="ion-padding" style="padding-top: 48px; padding-bottom: 48px;">
          <app-mini-map [segments]="segments"></app-mini-map>
        </div>

        <div *ngIf="selectedTab === 'hublot'" class="ion-padding">
          <h2>Vue par les hublots</h2>
          <app-window-hublot
            [lat]="currentSegment.lat"
            [lon]="currentSegment.lng"
            [altitude]="currentSegment.altitude"
            [side]="'left'">
          </app-window-hublot>
        </div>
      </ion-content>
    </div>
  `,
  styles: [`
    .fixed-slider {
      position: fixed;
      top: 48px;
      left: 0;
      right: 0;
      z-index: 1000;
      background: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      height: 36px;
    }
    .content-with-fixed-slider {
      margin-top: 70px; /* Hauteur ajustée du slider + tabs (plus compact) */
    }
    .progress-bar-container {
      margin: 2px 8px 0 8px;
      padding: 2px 8px 0 8px;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 1px 2px rgba(56,128,255,0.04);
    }
    .progress-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.95em;
      margin-bottom: 0;
      color: #3880ff;
      font-weight: 500;
    }
    ion-range {
      --bar-height: 3px;
      --knob-size: 13px;
      height: 18px;
      margin-top: 0;
      margin-bottom: 0;
    }
    .custom-tabs {
      display: flex;
      justify-content: space-around;
      background: #3880ff;
      border-radius: 0 0 10px 10px;
      margin: 0 0 2px 0;
      height: 28px;
    }
    .custom-tabs button {
      flex: 1;
      padding: 2px 0 2px 0;
      background: none;
      border: none;
      color: #fff;
      font-size: 0.98em;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      height: 100%;
      line-height: 20px;
    }
    .custom-tabs button.active {
      background: #3dc2ff;
      color: #222;
      font-weight: bold;
      border-bottom: 2px solid #fff;
    }
    .table-container {
      max-height: calc(100vh - 56px - 110px - 32px); /* header + fixed-slider + marges */
      overflow-y: auto;
      margin: 0 -16px;
    }
    .segments-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 0.95em;
    }
    .segments-table th, .segments-table td {
      border: 1px solid #e0e0e0;
      padding: 4px 8px;
      text-align: center;
    }
    .segments-table th {
      background: #e3f0ff;
      color: #3880ff;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    .active-segment {
      background: #3880ff !important;
      color: #fff;
      font-weight: bold;
    }
    .spinner-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60vh; font-size: 1.2em; color: #888; }
  `]
})
export class WindowTabsPage implements OnInit {
  realProgress = 29;
  simulatedProgress = 29;
  selectedTab: 'infos' | 'map' | 'hublot' = 'map';
  segments: any[] = [];
  currentSegment: any;
  departureTime: Date = new Date();
  arrivalTime: Date = new Date();
  remainingTime: number = 0;
  isRealData: boolean = false;
  realFlightInfo: { callsign: string; departureTime: Date; api: string } | null = null;
  isLoadingData = false;

  constructor(private flightEnrichmentService: FlightEnrichmentService) {
    console.log('[DEBUG] WindowTabsPage construit, selectedTab:', this.selectedTab, 'isLoadingData:', this.isLoadingData);
    this.loadRealFlightData();
  }

  ngOnInit() {
    this.loadData();
  }

  selectTab(tab: string) {
    this.selectedTab = tab as 'infos' | 'map' | 'hublot';
  }

  onSimulatedProgressChange(value: any): void {
    const percent = typeof value === 'object' ? (value?.lower ?? value?.upper ?? 0) : value;
    this.simulatedProgress = percent;
    this.calculateTimes();
    this.generateSegments();
    this.updateCurrentSegment();
  }

  updateCurrentSegment(): void {
    this.currentSegment = this.segments.find((seg: any) => seg.percent === this.simulatedProgress) || this.segments[0];
  }

  calculateTimes(): void {
    const now = new Date();
    const totalDurationMs = 3.25 * 60 * 60 * 1000;
    const elapsedMs = (this.simulatedProgress / 100) * totalDurationMs;
    this.departureTime = new Date(now.getTime() - elapsedMs);
    this.arrivalTime = new Date(this.departureTime.getTime() + totalDurationMs);
    this.remainingTime = Math.round((totalDurationMs - elapsedMs) / (60 * 1000));
  }

  generateSegments(): void {
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
    const trackDeg = getTrackDeg(startLat, startLng, endLat, endLng);
    const mapWidthPx = 600; // à adapter selon la taille réelle de ta carte
    const mapHeightPx = 400;

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
      const boundsHorizon = computeHublotBounds(lat, lng, altitude);
      const boundsLeft = computeOffsetHublotBounds(lat, lng, altitude, trackDeg, -30);
      const boundsRight = computeOffsetHublotBounds(lat, lng, altitude, trackDeg, +30);
      const zoomLeft = computeLeafletZoom(boundsLeft, mapWidthPx, mapHeightPx);
      const zoomRight = computeLeafletZoom(boundsRight, mapWidthPx, mapHeightPx);
      this.segments.push({
        percent,
        lat: +lat.toFixed(4),
        lng: +lng.toFixed(4),
        altitude: Math.round(altitude),
        speed: Math.round(speed),
        elapsedMin: Math.round(elapsedMin),
        heure,
        boundsHorizon,
        boundsLeft,
        boundsRight,
        zoomLeft,
        zoomRight
      });
    }
    classifyFlightPhases(this.segments);
    // Vérification du premier et dernier point
    const start = this.segments[0];
    const end = this.segments[this.segments.length - 1];
    const isStartOK = Math.abs(start.lat - startLat) < 0.05 && Math.abs(start.lng - startLng) < 0.05;
    const isEndOK = Math.abs(end.lat - endLat) < 0.05 && Math.abs(end.lng - endLng) < 0.05;
    if (!isStartOK || !isEndOK) {
      alert('⚠️ Trajectoire incohérente : le premier ou le dernier point ne correspond pas à Genève/Athènes ! Veuillez rafraîchir ou régénérer les segments.');
      this.segments = [];
    }
  }

  private loadRealFlightData() {
    this.flightEnrichmentService.enrichLatestGvaToAthFlight('time')
      .subscribe({
        next: (trackPoints: TrackPoint[]) => {
          console.log('[OpenSky] TrackPoints reçus dans la page (brut API):', trackPoints);
          this.isRealData = true;
          this.flightEnrichmentService.openSkyService.findLatestGvaToAthFlight().subscribe(flight => {
            if (flight) {
              this.realFlightInfo = {
                callsign: flight.callsign,
                departureTime: new Date(flight.firstSeen * 1000),
                api: 'OpenSky'
              };
            } else {
              this.realFlightInfo = null;
            }
          });
          this.segments = trackPoints.map((point, index) => {
            const percent = index;
            const elapsedMin = (point.time - trackPoints[0].time) / 60;
            const segmentTime = new Date(point.time * 1000);
            const heure = segmentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // Calcul des bounds pour les hublots
            const boundsHorizon = computeHublotBounds(point.lat, point.lon, point.alt);
            const trackDeg = index < trackPoints.length - 1 ? 
              getTrackDeg(point.lat, point.lon, trackPoints[index + 1].lat, trackPoints[index + 1].lon) :
              getTrackDeg(trackPoints[index - 1].lat, trackPoints[index - 1].lon, point.lat, point.lon);
            const boundsLeft = computeOffsetHublotBounds(point.lat, point.lon, point.alt, trackDeg, -30);
            const boundsRight = computeOffsetHublotBounds(point.lat, point.lon, point.alt, trackDeg, +30);
            const mapWidthPx = 600;
            const mapHeightPx = 400;
            const zoomLeft = computeLeafletZoom(boundsLeft, mapWidthPx, mapHeightPx);
            const zoomRight = computeLeafletZoom(boundsRight, mapWidthPx, mapHeightPx);
            return {
              percent,
              lat: +point.lat.toFixed(4),
              lng: +point.lon.toFixed(4),
              altitude: Math.round(point.alt * 3.28084), // Conversion m -> ft
              speed: Math.round(point.vel * 3.6), // Conversion m/s -> km/h
              elapsedMin: Math.round(elapsedMin),
              heure,
              boundsHorizon,
              boundsLeft,
              boundsRight,
              zoomLeft,
              zoomRight
            };
          });
          classifyFlightPhases(this.segments);
          this.updateCurrentSegment();
        },
        error: (error) => {
          this.isRealData = false;
          this.realFlightInfo = null;
          // Suppression de l'alerte : fallback silencieux sur la simulation
          this.generateSegments();
          this.updateCurrentSegment();
        }
      });
  }

  async loadData() {
    this.isLoadingData = true;
    // ... chargement asynchrone ...
    this.isLoadingData = false;
  }

  copySegmentsCSV() {
    if (!this.segments || this.segments.length === 0) return;
    const header = '%\tLat\tLng\tAltitude (ft)\tVitesse (km/h)\tTemps écoulé (min)\tHeure\tPhase';
    const rows = this.segments.map(s => [s.percent, s.lat, s.lng, s.altitude, s.speed, s.elapsedMin, s.heure, s.phase].join('\t'));
    const csv = [header, ...rows].join('\n');
    navigator.clipboard.writeText(csv).then(() => {
      alert('Segments copiés dans le presse-papier !');
    });
  }

  exportSegmentsCSV() {
    if (!this.segments || this.segments.length === 0) return;
    const header = '%\tLat\tLng\tAltitude (ft)\tVitesse (km/h)\tTemps écoulé (min)\tHeure\tPhase';
    const rows = this.segments.map(s => [s.percent, s.lat, s.lng, s.altitude, s.speed, s.elapsedMin, s.heure, s.phase].join('\t'));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/tab-separated-values' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'segments.tsv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
} 