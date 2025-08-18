import { Component, Input, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton, IonHeader, IonToolbar, IonTitle, IonContent, IonModal } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import * as L from 'leaflet';

@Component({
  selector: 'app-hublot-modal',
  standalone: true,
  imports: [CommonModule, IonIcon, IonButton, IonHeader, IonToolbar, IonTitle, IonContent, IonModal],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>
          🪟 Vue depuis le hublot {{ side === 'left' ? 'gauche' : 'droit' }}
        </ion-title>
        <ion-button slot="end" fill="clear" (click)="dismiss()">
          <ion-icon name="close"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="hublot-modal-container">
        <div class="hublot-info">
          <p><strong>Altitude:</strong> {{ altitude | number:'1.0-0' }} ft</p>
          <p><strong>Position:</strong> {{ debugInfo }}</p>
        </div>
        
        <div class="hublot-frame-large">
          <div class="hublot-background-large"></div>
          <div #mapContainer class="hublot-map-large"></div>
          <div class="hublot-mask-large"></div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .hublot-modal-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      height: 100%;
    }
    
    .hublot-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      width: 100%;
      max-width: 600px;
    }
    
    .hublot-info p {
      margin: 5px 0;
      color: #333;
    }
    
    .hublot-frame-large {
      position: relative;
      width: 600px;
      height: 400px;
      border-radius: 50% / 60%;
      overflow: hidden;
      background: transparent;
      box-shadow: 
        0 0 40px 8px #0008, 
        0 4px 32px #0006, 
        inset 0 0 64px #000c,
        0 0 0 16px #2c3e50,
        0 0 0 24px #34495e;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 12px solid #fff;
      outline: 6px solid #95a5a6;
      outline-offset: -24px;
      transform: perspective(2000px) rotateX(5deg);
    }
    
    .hublot-background-large {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjgwMCIgdmlld0JveD0iMCAwIDYwMCA4MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iODAwIiBmaWxsPSIjRkZGRkZGIi8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjU2MCIgaGVpZ2h0PSI3NjAiIGZpbGw9IiNEN0M5QjAiIHJ4PSIyMCIvPgo8cmVjdCB4PSI0MCIgeT0iNDAiIHdpZHRoPSI1MjAiIGhlaWdodD0iNzIwIiBmaWxsPSIjRkZGRkZGIiByeD0iMTYiLz4KPGNpcmNsZSBjeD0iMzAwIiBjeT0iMzYwIiByPSIxNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSI0Ii8+CjxjaXJjbGUgY3g9IjMwMCIgY3k9IjM2MCIgcj0iMTIwIiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSIzMDAiIGN5PSIzNjAiIHI9IjgwIiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSIzMDAiIGN5PSIzNjAiIHI9IjQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMiIvPgo8Y2lyY2xlIGN4PSIzMDAiIGN5PSIzNjAiIHI9IjIwIiBmaWxsPSIjOTk5OTk5Ii8+CjxyZWN0IHg9IjI4MCIgeT0iMzQwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiM5OTk5OTkiIHJ4PSIxMCIvPgo8cmVjdCB4PSIyODAiIHk9IjM0MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iNCIgcng9IjEwIi8+Cjwvc3ZnPgo=');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: 0;
      border-radius: 50% / 60%;
    }
    
    .hublot-map-large {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      background: #f0f0f0;
      border-radius: 50% / 60%;
      clip-path: circle(40% at 50% 50%);
    }
    
    .hublot-mask-large {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      border-radius: 50% / 60%;
      pointer-events: none;
      z-index: 2;
      background: radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.25) 100%);
      clip-path: circle(40% at 50% 50%);
    }
    
    @media (max-width: 768px) {
      .hublot-frame-large {
        width: 90vw;
        height: 60vw;
        max-width: 400px;
        max-height: 300px;
      }
    }
  `]
})
export class HublotModalComponent implements AfterViewInit, OnDestroy {
  @Input() lat!: number;
  @Input() lon!: number;
  @Input() altitude: number = 11000;
  @Input() side: 'left' | 'right' = 'left';
  @Input() debugInfo: string = '';
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private mapInstance!: L.Map;
  private tileLayer!: L.TileLayer;

  constructor(private modalController: ModalController) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  private initMap(): void {
    try {
      const lat = this.lat || 46.2381;
      const lon = this.lon || 6.1089;
      const alt = this.altitude || 11000;
      const zoom = this.getZoomFromAltitude(alt, lat);
      const planePosition = this.calculatePlanePosition(lat, lon, alt);
      
      if (!planePosition || !this.mapContainer?.nativeElement) {
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
      
      this.tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxZoom: 20
      });
      
      this.tileLayer.addTo(this.mapInstance);
      
      setTimeout(() => {
        this.mapInstance.invalidateSize();
      }, 200);
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du modal', error);
    }
  }

  private calculatePlanePosition(lat: number, lon: number, altitude: number): { lat: number, lon: number } | null {
    if (lat == null || lon == null || altitude == null) return null;
    
    const EARTH_RADIUS = 6378137;
    const altitudeMeters = altitude * 0.3048;
    const aircraftWidth = 30;
    const lateralOffsetMeters = aircraftWidth * 0.8;
    const lateralOffsetDeg = (lateralOffsetMeters / EARTH_RADIUS) * (180 / Math.PI);
    const flightHeading = 135;
    const perpendicularHeading = flightHeading + (this.side === 'left' ? -90 : 90);
    const perpendicularRad = (perpendicularHeading * Math.PI) / 180;
    
    const latOffset = lateralOffsetDeg * Math.cos(perpendicularRad);
    const lonOffset = lateralOffsetDeg * Math.sin(perpendicularRad);
    
    return {
      lat: lat + latOffset,
      lon: lon + lonOffset
    };
  }

  private getZoomFromAltitude(altitude: number, lat: number): number {
    const EARTH_RADIUS = 6378137;
    const latRad = (lat * Math.PI) / 180;
    const altitudeMeters = altitude * 0.3048;
    const passengerViewAngle = 60;
    const viewAngleRad = (passengerViewAngle * Math.PI) / 180;
    const viewDistance = altitudeMeters * Math.tan(viewAngleRad / 2);
    const denominator = 256 * viewDistance;
    const numerator = Math.cos(latRad) * 2 * Math.PI * EARTH_RADIUS;
    let zoom = Math.log2(numerator / denominator);
    
    zoom = Math.max(10, Math.min(16, zoom));
    
    if (altitude > 30000) {
      zoom += 1;
    } else if (altitude < 15000) {
      zoom -= 1;
    }
    
    return Math.round(zoom);
  }
} 