import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

@Component({
  selector: 'app-mini-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="border: 2.5px solid #1976d2; border-radius: 22px; box-shadow: 0 8px 32px #1976d244, 0 2px 12px #0001; width: 750px; height: 525px; background: #e3f0ff; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; margin: 56px auto 0 auto;">
      <div style="background: #ffeb3b; color: #d32f2f; font-size: 1.2em; font-weight: bold; text-align: center; width: 100%; padding: 8px 0; border-bottom: 1.5px solid #d32f2f;">
        [DEBUG] MiniMapComponent rendu !
      </div>
      <div #mapContainer style="width: 720px; height: 485px; border-radius: 16px; overflow: hidden; margin-top: 12px;"></div>
    </div>
  `
})
export class MiniMapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() segments: { lat: number, lng: number }[] = [];
  @Input() currentPercent: number = 0;
  private map: L.Map | null = null;
  private polyline: L.Polyline | null = null;
  private planeMarker: L.Marker | null = null;

  ngAfterViewInit() {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [46.2382, 6.1089],
      zoom: 6,
      zoomControl: true
    });
    L.tileLayer('https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=rgFTw67zstLijAdZKKVE', {
      attribution: '© MapTiler, OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(this.map);

    // Marqueur Genève (Départ)
    const genevaMarker = L.marker([46.2382, 6.1089]).addTo(this.map);
    genevaMarker.bindPopup('<b>Genève (Départ)</b>');

    // Marqueur Athènes (Arrivée)
    const athensMarker = L.marker([37.9838, 23.7275]).addTo(this.map);
    athensMarker.bindPopup('<b>Athènes (Arrivée)</b>');

    this.drawPolyline();
    this.updatePlaneMarker();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['segments'] && this.map) || changes['currentPercent']) {
      this.drawPolyline();
      this.updatePlaneMarker();
    }
  }

  private drawPolyline() {
    if (this.polyline) {
      this.polyline.remove();
      this.polyline = null;
    }
    if (this.segments && this.segments.length > 1 && this.map) {
      const latlngs = this.segments.map(pt => [pt.lat, pt.lng] as [number, number]);
      this.polyline = L.polyline(latlngs, { color: '#1976d2', weight: 4, opacity: 0.8 }).addTo(this.map);
    }
  }

  private updatePlaneMarker() {
    if (!this.map || !this.segments || this.segments.length < 2) return;
    // Trouver l'index du segment courant selon currentPercent
    const idx = Math.round((this.currentPercent / 100) * (this.segments.length - 1));
    const pt = this.segments[idx];
    // Calculer l'orientation (cap) entre ce point et le suivant (ou précédent)
    let heading = 0;
    if (idx < this.segments.length - 1) {
      heading = this.computeHeading(pt, this.segments[idx + 1]);
    } else if (idx > 0) {
      heading = this.computeHeading(this.segments[idx - 1], pt);
    }
    // Floor à la tranche de 15 degrés la plus proche et normalisation
    let headingInt = Math.floor(heading / 15) * 15;
    headingInt = ((headingInt % 360) + 360) % 360;
    const iconPath = `assets/plane_${headingInt}deg.png`;
    console.log('[MiniMap] Avion: idx', idx, 'lat', pt.lat, 'lng', pt.lng, 'cap', headingInt, 'icon', iconPath);
    // Supprimer l'ancien marqueur
    if (this.planeMarker) {
      this.planeMarker.remove();
      this.planeMarker = null;
    }
    // Créer l'icône personnalisée
    const icon = L.icon({
      iconUrl: iconPath,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -24]
    });
    // Ajouter le nouveau marqueur
    this.planeMarker = L.marker([pt.lat, pt.lng], { icon }).addTo(this.map);
    this.planeMarker.bindPopup(`<b>Avion</b><br>Lat: ${pt.lat.toFixed(4)}<br>Lng: ${pt.lng.toFixed(4)}<br>Cap: ${headingInt}°`);
    // Fallback si l'image ne se charge pas
    const img = new window.Image();
    img.onerror = () => {
      // Remplacer par l'icône par défaut
      if (this.planeMarker) {
        this.planeMarker.setIcon(L.Icon.Default.prototype);
      }
    };
    img.src = iconPath;
  }

  private computeHeading(a: { lat: number, lng: number }, b: { lat: number, lng: number }): number {
    // Calcul du cap initial (bearing) entre deux points
    const toRad = (deg: number) => deg * Math.PI / 180;
    const toDeg = (rad: number) => rad * 180 / Math.PI;
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const dLon = toRad(b.lng - a.lng);
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let brng = Math.atan2(y, x);
    brng = toDeg(brng);
    return (brng + 360) % 360;
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
} 