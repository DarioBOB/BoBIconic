import { Component, Input, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController } from '@ionic/angular/standalone';
import * as L from 'leaflet';
import { HublotModalComponent } from './hublot-modal/hublot-modal.component';
// Supprimer l'import CSS de Leaflet pour éviter les erreurs d'images
// import 'leaflet/dist/leaflet.css';

@Component({
  selector: 'app-window-hublot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hublot-frame" (click)="openHublotModal()">
      <div class="hublot-background"></div>
      <div #mapContainer class="hublot-map"></div>
      <div class="hublot-mask"></div>
      <div class="hublot-debug" *ngIf="debugInfo">
        <small>{{ debugInfo }}</small>
      </div>
      <div class="hublot-click-hint">
        <span>🔍</span>
      </div>
    </div>
  `,
  styles: [`
    .hublot-frame {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 50% / 60%;
      overflow: hidden;
      background: #d7c9b0;
      box-shadow: 
        0 0 24px 4px #0006, 
        0 2px 16px #0004, 
        inset 0 0 32px #000a,
        0 0 0 8px #2c3e50,
        0 0 0 12px #34495e;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 6px solid #fff;
      outline: 3px solid #95a5a6;
      outline-offset: -12px;
      transition: box-shadow 0.3s;
      transform: perspective(1000px) rotateX(5deg);
      cursor: pointer;
    }
    
    .hublot-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #d7c9b0;
      z-index: 0;
      border-radius: 50% / 60%;
    }
    
    .hublot-frame::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50% / 60%;
      border: 3px solid #fff8;
      pointer-events: none;
      box-shadow: 
        0 0 24px 2px #fff4 inset,
        0 0 0 1px #bdc3c7;
      z-index: 4;
    }
    
    .hublot-frame::before {
      content: '';
      position: absolute;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 8px;
      background: #666;
      border-radius: 4px;
      z-index: 5;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .hublot-map {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      background: #f0f0f0;
      border-radius: 50% / 60%;
      clip-path: none; /* Supprimé le clip-path pour que la carte remplisse tout le hublot */
    }
    
    .hublot-mask {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      border-radius: 50% / 60%;
      pointer-events: none;
      z-index: 2;
      background: radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.25) 100%);
      clip-path: none; /* Supprimé le clip-path pour que le masque couvre tout le hublot */
    }
    
    .hublot-debug {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      z-index: 10;
      font-family: monospace;
    }
    
    .hublot-click-hint {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      background: rgba(0,0,0,0.6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 11;
      cursor: pointer;
      border: 2px solid #fff;
      box-shadow: 0 0 10px #fff;
      font-size: 20px;
    }
    
    @media (max-width: 900px) {
      .hublot-frame { min-width: 120px; min-height: 140px; }
    }
    @media (max-width: 600px) {
      .hublot-frame { min-width: 100px; min-height: 120px; }
    }
  `]
})
export class WindowHublotComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() lat!: number;
  @Input() lon!: number;
  @Input() altitude: number = 11000; // en pieds
  @Input() side: 'left' | 'right' = 'left';
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private mapInstance!: L.Map;
  private tileLayer!: L.TileLayer;
  private centerMarker?: L.Marker;
  debugInfo: string = '';

  constructor(private modalController: ModalController) {}

  ngAfterViewInit(): void {
    console.log(`WindowHublotComponent [${this.side}]: ngAfterViewInit`, {
      lat: this.lat,
      lon: this.lon,
      altitude: this.altitude,
      side: this.side
    });
    
    setTimeout(() => {
      this.initMap();
    }, 100);
    
    window.addEventListener('resize', this.handleResize);
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(`WindowHublotComponent [${this.side}]: ngOnChanges`, changes);
    
    if (this.mapInstance && (changes['lat'] || changes['lon'] || changes['altitude'])) {
      this.updateMapView();
    }
  }

  ngOnDestroy(): void {
    if (this.mapInstance) {
      try {
        this.mapInstance.remove();
        this.mapInstance = null as any;
        this.tileLayer = null as any;
        this.centerMarker = undefined;
        console.log(`WindowHublotComponent [${this.side}]: Carte nettoyée`);
      } catch (error) {
        console.error(`WindowHublotComponent [${this.side}]: Erreur lors du nettoyage`, error);
      }
    }
    window.removeEventListener('resize', this.handleResize);
  }

  private initMap(): void {
    try {
      // Vérifier si la carte est déjà initialisée
      if (this.mapInstance) {
        console.log(`WindowHublotComponent [${this.side}]: Carte déjà initialisée, mise à jour uniquement`);
        this.updateMapView();
        return;
      }

      const lat = this.lat || 46.2381; // GVA par défaut
      const lon = this.lon || 6.1089; // GVA par défaut
      const alt = this.altitude || 11000;
      const zoom = this.getZoomFromAltitude(alt, lat);
      const viewAngle = this.getViewAngle(alt);
      const planePosition = this.calculatePlanePosition(lat, lon, alt);
      
      console.log(`WindowHublotComponent [${this.side}]: initMap`, {
        lat, lon, alt, zoom, viewAngle, planePosition
      });
      
      if (!planePosition) {
        console.error(`WindowHublotComponent [${this.side}]: Impossible de calculer la position de l'avion`);
        this.debugInfo = 'Erreur: position invalide';
        return;
      }
      
      if (!this.mapContainer?.nativeElement) {
        console.error(`WindowHublotComponent [${this.side}]: Container map non trouvé`);
        this.debugInfo = 'Erreur: container manquant';
        return;
      }

      // Vérifier si le container a déjà une carte Leaflet
      if ((this.mapContainer.nativeElement as any)._leaflet_id) {
        console.log(`WindowHublotComponent [${this.side}]: Container déjà utilisé par une carte Leaflet`);
        this.debugInfo = 'Erreur: container déjà utilisé';
        return;
      }
      
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
      
      // Utiliser une couche satellite sans les images Leaflet par défaut
      this.tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxZoom: 20
      });
      
      this.tileLayer.addTo(this.mapInstance);
      
      // Créer un marqueur invisible pour le centre
      this.centerMarker = L.marker([planePosition.lat, planePosition.lon], {
        icon: L.divIcon({
          html: '',
          className: '',
          iconSize: [1, 1],
          iconAnchor: [0, 0],
        }),
      }).addTo(this.mapInstance);
      
      this.debugInfo = `${planePosition.lat.toFixed(4)}, ${planePosition.lon.toFixed(4)} | z:${zoom}`;
      
      console.log(`WindowHublotComponent [${this.side}]: Carte initialisée avec succès`);
      
      // Forcer le rafraîchissement de la carte
      setTimeout(() => {
        if (this.mapInstance) {
          this.mapInstance.invalidateSize();
        }
      }, 200);
      
    } catch (error) {
      console.error(`WindowHublotComponent [${this.side}]: Erreur lors de l'initialisation`, error);
      this.debugInfo = 'Erreur: ' + (error as Error).message;
    }
  }

  private updateMapView(): void {
    try {
      const lat = this.lat || 46.2381;
      const lon = this.lon || 6.1089;
      const alt = this.altitude || 11000;
      const zoom = this.getZoomFromAltitude(alt, lat);
      const viewAngle = this.getViewAngle(alt);
      const planePosition = this.calculatePlanePosition(lat, lon, alt);
      
      console.log(`WindowHublotComponent [${this.side}]: updateMapView`, {
        lat, lon, alt, zoom, viewAngle, planePosition
      });
      
      if (!planePosition) return;
      
      const bounds = this.getMaxBounds(planePosition.lat, planePosition.lon, viewAngle);
      this.mapInstance.setMaxBounds(bounds);
      this.mapInstance.setView([planePosition.lat, planePosition.lon], zoom);
      
      if (this.centerMarker) {
        this.centerMarker.setLatLng([planePosition.lat, planePosition.lon]);
      }
      
      this.debugInfo = `${planePosition.lat.toFixed(4)}, ${planePosition.lon.toFixed(4)} | z:${zoom}`;
      
    } catch (error) {
      console.error(`WindowHublotComponent [${this.side}]: Erreur lors de la mise à jour`, error);
      this.debugInfo = 'Erreur: ' + (error as Error).message;
    }
  }

  private calculatePlanePosition(lat: number, lon: number, altitude: number): { lat: number, lon: number } | null {
    if (lat == null || lon == null || altitude == null) return null;
    
    // Position de base de l'avion (centre de la trajectoire)
    const baseLat = lat;
    const baseLon = lon;
    
    // Calcul du cap du vol (GVA-ATH = 135°)
    const flightHeading = 135;
    
    // Décalage latéral selon le côté du hublot
    // Un avion commercial fait environ 60m de large, donc 30m de chaque côté
    const aircraftWidth = 30; // mètres
    const lateralOffsetMeters = aircraftWidth * 2; // 60m de décalage pour plus de différence
    
    // Conversion en degrés (approximatif)
    const EARTH_RADIUS = 6378137; // Rayon de la Terre en mètres
    const lateralOffsetDeg = (lateralOffsetMeters / EARTH_RADIUS) * (180 / Math.PI);
    
    // Calcul de l'angle perpendiculaire au cap de vol
    const perpendicularHeading = flightHeading + (this.side === 'left' ? -90 : 90);
    const perpendicularRad = (perpendicularHeading * Math.PI) / 180;
    
    // Application du décalage latéral
    const latOffset = lateralOffsetDeg * Math.cos(perpendicularRad);
    const lonOffset = lateralOffsetDeg * Math.sin(perpendicularRad);
    
    // Position finale du hublot
    const hublotLat = baseLat + latOffset;
    const hublotLon = baseLon + lonOffset;
    
    console.log(`WindowHublotComponent [${this.side}]: Position calculée`, {
      base: { lat: baseLat, lon: baseLon },
      offset: { lat: latOffset, lon: lonOffset },
      final: { lat: hublotLat, lon: hublotLon },
      lateralOffsetMeters,
      perpendicularHeading
    });
    
    return {
      lat: hublotLat,
      lon: hublotLon
    };
  }

  private getZoomFromAltitude(altitude: number, lat: number): number {
    // Angle de vue du passager (plus réaliste)
    const passengerViewAngle = 60; // degrés
    const viewAngleRad = (passengerViewAngle * Math.PI) / 180;
    
    // Conversion altitude en mètres
    const altitudeMeters = altitude * 0.3048;
    
    // Calcul de la distance de vue en mètres
    const viewDistance = altitudeMeters * Math.tan(viewAngleRad / 2);
    
    // Calcul du zoom basé sur la distance de vue
    // Plus l'altitude est élevée, plus le zoom est faible
    let zoom = 16 - Math.log2(viewDistance / 1000);
    
    // Limiter le zoom entre 10 et 16
    zoom = Math.max(10, Math.min(16, zoom));
    
    // Ajustement selon l'altitude
    if (altitude > 30000) {
      zoom += 1; // Zoom plus élevé en altitude
    } else if (altitude < 15000) {
      zoom -= 1; // Zoom plus faible à basse altitude
    }
    
    // Légère différence selon le côté pour plus de réalisme
    if (this.side === 'left') {
      zoom += 0.2;
    } else {
      zoom -= 0.2;
    }
    
    return Math.round(zoom);
  }

  private getViewAngle(altitude: number): number {
    // Angle de vue en degrés selon l'altitude
    // Un passager regarde principalement vers le bas et légèrement vers l'horizon
    const minAlt = 0;
    const maxAlt = 40000;
    const minAngle = 45;  // Vue plus vers le bas
    const maxAngle = 75;  // Vue plus large en haute altitude
    const alt = Math.max(minAlt, Math.min(maxAlt, altitude));
    
    let angle = minAngle + ((alt - minAlt) / (maxAlt - minAlt)) * (maxAngle - minAngle);
    
    // Ajustement selon l'altitude pour plus de réalisme
    if (alt < 10000) {
      angle = 35; // Vue plus vers le bas au décollage/atterrissage
    } else if (alt > 30000) {
      angle = 80; // Vue plus large en croisière
    }
    
    return angle;
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

  openHublotModal() {
    this.modalController.create({
      component: HublotModalComponent,
      componentProps: {
        lat: this.lat,
        lon: this.lon,
        altitude: this.altitude,
        side: this.side,
        debugInfo: this.debugInfo
      },
      cssClass: 'hublot-modal',
      backdropDismiss: true,
      showBackdrop: true
    }).then(modal => {
      modal.present();
    });
  }
} 