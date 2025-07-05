import { Component, Input, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

@Component({
  selector: 'app-window-hublot',
  standalone: true,
  template: `
    <div class="hublot-frame">
      <div #mapContainer class="hublot-map"></div>
      <div class="hublot-mask"></div>
    </div>
  `,
  styles: [`
    .hublot-frame {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 48% / 60%;
      overflow: hidden;
      background: transparent;
      box-shadow: 0 0 24px 4px #0006, 0 2px 16px #0004, inset 0 0 32px #000a;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 4px solid #fff;
      outline: 2px solid #b0b8c6;
      outline-offset: -8px;
      transition: box-shadow 0.3s;
    }
    .hublot-frame::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 48% / 60%;
      border: 2.5px solid #fff8;
      pointer-events: none;
      box-shadow: 0 0 24px 2px #fff4 inset;
    }
    .hublot-map {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }
    .hublot-mask {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      border-radius: 48% / 60%;
      pointer-events: none;
      z-index: 2;
      background: radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.01) 60%, rgba(0,0,0,0.18) 100%);
      /* effet de vignettage pour immersion */
    }
    @media (max-width: 900px) {
      .hublot-frame { min-width: 70px; min-height: 90px; }
    }
    @media (max-width: 600px) {
      .hublot-frame { min-width: 50px; min-height: 60px; }
    }
  `]
})
export class WindowHublotComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() lat!: number;
  @Input() lon!: number;
  @Input() altitude: number = 11000; // en mètres
  @Input() side: 'left' | 'right' = 'left';
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private mapInstance!: L.Map;
  private tileLayer!: L.TileLayer;
  private centerMarker?: L.Marker;

  ngAfterViewInit(): void {
    this.initMap();
    window.addEventListener('resize', this.handleResize);
    setTimeout(() => this.handleResize(), 300);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.mapInstance && (changes['lat'] || changes['lon'] || changes['altitude'])) {
      this.updateMapView();
    }
  }

  ngOnDestroy(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
    }
    window.removeEventListener('resize', this.handleResize);
  }

  private initMap(): void {
    const lat = this.lat || 0;
    const lon = this.lon || 0;
    const alt = this.altitude || 11000;
    const zoom = this.getZoomFromAltitude(alt, lat);
    const viewAngle = this.getViewAngle(alt);
    const planePosition = this.calculatePlanePosition(lat, lon, alt);
    if (!planePosition) return;
    this.mapInstance = L.map(this.mapContainer.nativeElement, {
      center: [planePosition.lat, planePosition.lon],
      zoom,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      maxBoundsViscosity: 1.0
    });
    const bounds = this.getMaxBounds(planePosition.lat, planePosition.lon, viewAngle);
    this.mapInstance.setMaxBounds(bounds);
    this.tileLayer = L.tileLayer('https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=rgFTw67zstLijAdZKKVE', {
      attribution: '© MapTiler, OpenStreetMap contributors',
      maxZoom: 20
    });
    this.tileLayer.addTo(this.mapInstance);
    L.tileLayer('https://api.maptiler.com/tiles/hillshades/{z}/{x}/{y}.png?key=rgFTw67zstLijAdZKKVE', {
      opacity: 0.3,
      maxZoom: 20
    }).addTo(this.mapInstance);
    this.centerMarker = L.marker([planePosition.lat, planePosition.lon], {
      icon: L.divIcon({
        html: '',
        className: '',
        iconSize: [1, 1],
        iconAnchor: [0, 0],
      }),
    }).addTo(this.mapInstance);
  }

  private updateMapView(): void {
    const lat = this.lat || 0;
    const lon = this.lon || 0;
    const alt = this.altitude || 11000;
    const zoom = this.getZoomFromAltitude(alt, lat);
    const viewAngle = this.getViewAngle(alt);
    const planePosition = this.calculatePlanePosition(lat, lon, alt);
    if (!planePosition) return;
    const bounds = this.getMaxBounds(planePosition.lat, planePosition.lon, viewAngle);
    this.mapInstance.setMaxBounds(bounds);
    this.mapInstance.setView([planePosition.lat, planePosition.lon], zoom);
    if (this.centerMarker) {
      this.centerMarker.setLatLng([planePosition.lat, planePosition.lon]);
    }
  }

  private calculatePlanePosition(lat: number, lon: number, altitude: number): { lat: number, lon: number } | null {
    if (lat == null || lon == null || altitude == null) return null;
    // Calcul de la position exacte de l'avion en tenant compte de l'altitude
    const EARTH_RADIUS = 6378137; // Rayon de la Terre en mètres
    const altitudeMeters = altitude * 0.3048; // Conversion des pieds en mètres

    // Calcul de l'angle de vue en radians
    const viewAngleRad = (this.getViewAngle(altitude) * Math.PI) / 180;

    // Calcul de la distance de vue en mètres
    const viewDistance = altitudeMeters * Math.tan(viewAngleRad);

    // Calcul de l'angle de vue en degrés
    const viewAngleDeg = (viewDistance / EARTH_RADIUS) * (180 / Math.PI);

    // Cap du vol (GVA-ATH)
    const flightHeading = 135;
    // Pour le hublot gauche, on regarde à 45° à gauche du cap (90°)
    // Pour le hublot droit, à 45° à droite du cap (180°)
    const hublotHeading = this.side === 'left' ? flightHeading - 45 : flightHeading + 45;
    const headingRad = (hublotHeading * Math.PI) / 180;

    // Décalage selon la direction du hublot
    const latOffset = viewAngleDeg * Math.cos(headingRad) * 0.5;
    const lonOffset = viewAngleDeg * Math.sin(headingRad) * 0.5;

    return {
      lat: lat + latOffset,
      lon: lon + lonOffset
    };
  }

  private getZoomFromAltitude(altitude: number, lat: number): number {
    const EARTH_RADIUS = 6378137;
    const latRad = (lat * Math.PI) / 180;
    const denominator = 256 * altitude;
    const numerator = Math.cos(latRad) * 2 * Math.PI * EARTH_RADIUS;
    let zoom = Math.log2(numerator / denominator);

    // Ajustement du zoom pour une meilleure vue passager
    zoom = Math.max(8, Math.min(15, zoom));
    return Math.round(zoom);
  }

  private getViewAngle(altitude: number): number {
    // Angle de vue en degrés selon l'altitude
    // Plus l'altitude est élevée, plus l'angle est grand
    const minAlt = 0;
    const maxAlt = 40000;
    const minAngle = 30;
    const maxAngle = 60;
    const alt = Math.max(minAlt, Math.min(maxAlt, altitude));
    return (
      minAngle +
      ((alt - minAlt) / (maxAlt - minAlt)) * (maxAngle - minAngle)
    );
  }

  private getMaxBounds(lat: number, lon: number, viewAngle: number): L.LatLngBounds {
    const EARTH_RADIUS = 6378137;
    const altitudeMeters = this.altitude * 0.3048;
    const viewAngleRad = (viewAngle * Math.PI) / 180;
    const viewDistance = altitudeMeters * Math.tan(viewAngleRad);
    const viewAngleDeg = (viewDistance / EARTH_RADIUS) * (180 / Math.PI);

    // Calcul des limites de la vue
    const latOffset = viewAngleDeg * 0.5;
    const lonOffset = viewAngleDeg * 0.5;

    return L.latLngBounds(
      [lat - latOffset, lon - lonOffset],
      [lat + latOffset, lon + lonOffset]
    );
  }

  private handleResize = () => {
    if (this.mapInstance) {
      this.mapInstance.invalidateSize();
    }
  }
} 