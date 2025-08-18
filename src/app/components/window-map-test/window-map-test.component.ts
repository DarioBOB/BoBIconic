import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import * as L from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// Correction des chemins d'assets Leaflet pour Angular
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet-images/marker-icon-2x.png',
  iconUrl: 'assets/leaflet-images/marker-icon.png',
  shadowUrl: 'assets/leaflet-images/marker-shadow.png',
});

@Component({
  selector: 'app-window-map-test',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div id="map"></div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    #map, .leaflet-container {
      height: 100%;
      width: 100%;
      background: #fff;
      margin: 0;
      display: block;
    }
  `]
})
export class WindowMapTestComponent implements OnInit, OnDestroy, OnChanges {
  @Input() lat: number = 0;
  @Input() lon: number = 0;
  @Input() segments: any[] = [];
  @Input() currentPercent: number = 0;
  private map: L.Map | null = null;
  private planeIcon: L.Icon | null = null;
  private planeMarker: L.Marker | null = null;
  private flightPath: L.Polyline | null = null;

  ngOnInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('▶ ngOnChanges() : segments =', this.segments, ', currentPercent =', this.currentPercent);
    if (this.map && (changes['segments'] || changes['currentPercent'])) {
      this.drawFlightPath();
      this.updatePlaneMarker();
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    // Initialize map
    this.map = L.map('map', {
      center: [42, 15],
      zoom: 5,
      zoomControl: false,
      attributionControl: false
    });

    // Add satellite layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19
    }).addTo(this.map);

    // Create custom plane icon
    this.planeIcon = L.icon({
      iconUrl: 'assets/plane-icon.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });

    this.drawFlightPath();
    this.updatePlaneMarker();
  }

  private drawFlightPath() {
    if (!this.map) return;
    console.log('DEBUG ▶ segments reçus dans drawFlightPath():', this.segments);
    const points = this.segments.map(s => [s.lat, s.lng] as [number, number]);
    console.log('DEBUG ▶ points.length =', points.length);

    // Nettoyer anciens tracés
    if (this.flightPath) this.map.removeLayer(this.flightPath);
    if (this.planeMarker) this.map.removeLayer(this.planeMarker);

    if (points.length < 2) {
      // Tracé statique Genève-Athènes pour debug
      const debugPoints: [number,number][] = [
        [46.2381, 6.1080],
        [37.9364, 23.9445]
      ];
      this.flightPath = L.polyline(debugPoints, { color: 'red', weight: 5 }).addTo(this.map);
      this.map.fitBounds(L.latLngBounds(debugPoints));
      return;
    }

    // Calcul de l'index de progression
    const progressIdx = Math.floor(this.currentPercent / 100 * (points.length - 1));
    
    // Partie parcourue (trait plein bleu vif)
    const completedPoints = points.slice(0, progressIdx + 1);
    this.flightPath = L.polyline(completedPoints, {
      color: '#1976D2',
      weight: 5,
      opacity: 1
    }).addTo(this.map);

    // Partie restante (pointillés bleu clair)
    const remainingPoints = points.slice(progressIdx);
    L.polyline(remainingPoints, {
      color: '#90CAF9',
      weight: 5,
      opacity: 0.7,
      dashArray: '8, 12'
    }).addTo(this.map);

    // Adapter la vue
    this.map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
  }

  private updatePlaneMarker() {
    if (!this.map || !this.planeIcon) return;
    
    // Trouver la position actuelle selon la progression
    const points = this.segments.map(s => [s.lat, s.lng] as [number, number]);
    let idx = Math.floor(this.currentPercent / 100 * (points.length - 1));
    if (idx < 0) idx = 0;
    if (idx >= points.length) idx = points.length - 1;
    
    const [lat, lon] = points[idx];
    
    // Calcul du cap (heading)
    let heading = 0;
    if (idx < points.length - 1) {
      const [lat1, lon1] = points[idx];
      const [lat2, lon2] = points[idx + 1];
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;
      const y = Math.sin(Δλ) * Math.cos(φ2);
      const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
      let θ = Math.atan2(y, x) * 180 / Math.PI;
      if (θ < 0) θ += 360;
      heading = θ;
    }

    // Créer ou mettre à jour le marqueur
    if (this.planeMarker) {
      this.planeMarker.setLatLng([lat, lon]);
    } else {
      this.planeMarker = L.marker([lat, lon], {
        icon: this.planeIcon
      }).addTo(this.map);
    }

    // Mettre à jour la rotation
    if (this.planeMarker.getElement()) {
      const element = this.planeMarker.getElement();
      if (element) {
        element.style.transform = `rotate(${heading}deg)`;
      }
    }

    this.map.panTo([lat, lon]);
  }
} 