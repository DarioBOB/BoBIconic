import { Component, AfterViewInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

@Component({
  selector: 'app-window-map-test',
  standalone: true,
  template: `<div id="map"></div>`,
  styles: [`
    #map, .leaflet-container {
      height: 90vh !important;
      width: 100vw !important;
      min-height: 400px !important;
      background: #fff !important;
      margin: 0;
      display: block;
    }
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
  `]
})
export class WindowMapTestComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() lat: number | string = 0;
  @Input() lon: number | string = 0;
  @Input() altitude: number = 11000;
  @Input() segments: any[] = [];
  @Input() currentPercent: number = 0;

  map: L.Map | null = null;
  planeMarker: L.Marker | null = null;
  departureMarker: L.Marker | null = null;
  arrivalMarker: L.Marker | null = null;
  completedPath: L.Polyline | null = null;
  remainingPath: L.Polyline | null = null;

  ngAfterViewInit() {
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

  initMap() {
    this.map = L.map('map').setView([44, 15], 6);
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles © Esri', maxZoom: 19 }
    ).addTo(this.map);
    this.drawFlightPath();
    this.updatePlaneMarker();
  }

  drawFlightPath() {
    if (!this.map) return;
    console.log('DEBUG ▶ segments reçus dans drawFlightPath():', this.segments);
    const points = this.segments.map(s => [s.lat, s.lng] as [number, number]);
    console.log('DEBUG ▶ points.length =', points.length);
    // Nettoyer anciens tracés/markers
    if (this.completedPath) this.map.removeLayer(this.completedPath);
    if (this.remainingPath) this.map.removeLayer(this.remainingPath);
    if (this.departureMarker) this.map.removeLayer(this.departureMarker);
    if (this.arrivalMarker) this.map.removeLayer(this.arrivalMarker);
    if ((this as any)._debugMarkers) {
      (this as any)._debugMarkers.forEach((m: L.Layer) => this.map!.removeLayer(m));
    }
    (this as any)._debugMarkers = [];

    if (points.length < 2) {
      // Tracé statique Genève-Athènes pour debug
      const debugPoints: [number,number][] = [
        [46.2381, 6.1080],
        [37.9364, 23.9445]
      ];
      L.polyline(debugPoints, { color: 'red', weight: 5 }).addTo(this.map);
      this.map.fitBounds(L.latLngBounds(debugPoints));
      const center = this.map.getCenter();
      L.popup()
        .setLatLng(center)
        .setContent('<b>ERREUR : Aucun segment transmis à la carte !<br>Tracé statique affiché.</b>')
        .openOn(this.map);
      return;
    }

    // Overlay de debug : nombre de points et coordonnées
    const debugText = `Segments reçus : ${points.length}<br>Départ : ${points[0][0].toFixed(4)}, ${points[0][1].toFixed(4)}<br>Arrivée : ${points[points.length-1][0].toFixed(4)}, ${points[points.length-1][1].toFixed(4)}`;
    const debugDiv = L.control({position: 'topright'});
    debugDiv.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-bar');
      div.style.background = '#fff';
      div.style.padding = '8px';
      div.style.fontSize = '14px';
      div.style.boxShadow = '0 2px 8px #0002';
      div.innerHTML = debugText;
      return div;
    };
    debugDiv.addTo(this.map);
    (this as any)._debugDiv = debugDiv;

    // Marqueur départ (Genève) - debug : icône par défaut
    this.departureMarker = L.marker(points[0], {
      title: 'Départ',
      riseOnHover: true
    }).addTo(this.map).bindPopup('Genève Aéroport (GVA)');

    // Marqueur arrivée (Athènes) - debug : icône par défaut
    this.arrivalMarker = L.marker(points[points.length - 1], {
      title: 'Arrivée',
      riseOnHover: true
    }).addTo(this.map).bindPopup('Athènes Elefthérios-Venizélos (ATH)');

    // Marker/cercle sur chaque point du trajet (debug)
    points.forEach(([lat, lng], i) => {
      const c = L.circleMarker([lat, lng], {
        radius: 4,
        color: i === 0 ? 'green' : (i === points.length-1 ? 'red' : '#1976D2'),
        fillColor: i === 0 ? 'green' : (i === points.length-1 ? 'red' : '#1976D2'),
        fillOpacity: 0.7,
        weight: 1
      }).addTo(this.map);
      (this as any)._debugMarkers.push(c);
    });

    // Calcul de l'index de progression
    const progressIdx = Math.floor(this.currentPercent / 100 * (points.length - 1));
    // Partie parcourue (trait plein bleu vif)
    const completedPoints = points.slice(0, progressIdx + 1);
    this.completedPath = L.polyline(completedPoints, {
      color: '#1976D2',
      weight: 5,
      opacity: 1
    }).addTo(this.map);
    // Partie restante (pointillés bleu clair)
    const remainingPoints = points.slice(progressIdx);
    this.remainingPath = L.polyline(remainingPoints, {
      color: '#90CAF9',
      weight: 5,
      opacity: 0.7,
      dashArray: '8, 12'
    }).addTo(this.map);
    // Adapter la vue
    this.map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  updatePlaneMarker() {
    if (!this.map) return;
    if (this.planeMarker) {
      this.map.removeLayer(this.planeMarker);
    }
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
    const rounded = Math.round(heading / 15) * 15;
    const normalized = (rounded + 360) % 360;
    const pad = (n: number) => n.toString().padStart(3, '0');
    const planeImagePath = `assets/plane_${pad(normalized)}deg.png`;
    this.planeMarker = L.marker([lat, lon], {
      icon: L.icon({
        iconUrl: planeImagePath,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      })
    }).addTo(this.map);
    this.map.panTo([lat, lon]);
  }
} 