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
  private map: L.Map | null = null;
  private polyline: L.Polyline | null = null;

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
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['segments'] && this.map) {
      this.drawPolyline();
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

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
} 