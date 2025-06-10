import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { WindowService, POI } from '../../services/window.service';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TrackPoint } from '../../services/flight/models/track-point.interface';
import { TrajectoryService } from '../../services/trajectory.service';

@Component({
  selector: 'app-window-map',
  templateUrl: './window-map.page.html',
  styleUrls: ['./window-map.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule
  ]
})
export class WindowMapPage implements OnInit, OnDestroy {
  @ViewChild('map') mapContainer!: ElementRef;

  private map!: L.Map;
  private aircraftMarker!: L.Marker;
  private flightPath!: L.Polyline;
  private departureMarker!: L.Marker;
  private arrivalMarker!: L.Marker;
  private poiMarkers: L.Marker[] = [];
  public pois: POI[] = [];
  isLoadingMap = true;

  private subscriptions: Subscription[] = [];
  private segments: TrackPoint[] = [];
  public currentMode: string = 'DEMO';

  constructor(
    private windowService: WindowService,
    private trajectoryService: TrajectoryService
  ) {}

  async ngOnInit() {
    // Utiliser le mode REAL pour avoir la trajectoire complète
    this.currentMode = 'REAL';
    
    // S'abonner aux observables du service
    this.subscriptions.push(
      this.windowService.dynamicData$.subscribe(data => {
        this.updateAircraftPosition(data.position);
      }),
      this.windowService.pois$.subscribe(pois => {
        this.pois = pois;
        this.updatePOIs(pois);
        this.isLoadingMap = false;
      }),
      this.windowService.getSegments().subscribe(segments => {
        this.segments = segments;
        this.updateFlightPath();
      })
    );
  }

  ngAfterViewInit() {
    this.initMap();
    this.addAirportMarkersIfDemo();
  }

  ngOnDestroy() {
    // Nettoyer les abonnements et la carte
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    // Configuration de la carte
    const mapConfig = {
      center: [45.0, 12.0] as [number, number],
      zoom: 5,
      zoomControl: false
    };

    // Création de la carte
    this.map = L.map(this.mapContainer.nativeElement, mapConfig);

    // Ajout du fond de carte
    L.tileLayer('https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=rgFTw67zstLijAdZKKVE', {
      attribution: '© MapTiler, OpenStreetMap contributors',
      maxZoom: 20
    }).addTo(this.map);

    // Ajout de la couche de relief
    L.tileLayer('https://api.maptiler.com/tiles/hillshades/{z}/{x}/{y}.png?key=rgFTw67zstLijAdZKKVE', {
      opacity: 0.3,
      maxZoom: 20
    }).addTo(this.map);

    // Marqueur de l'avion (toujours présent)
    const startPos = { lat: 46.2382, lng: 6.1089 }; // Genève
    const aircraftIcon = L.divIcon({
      className: 'aircraft-marker',
      html: '✈️',
      iconSize: [30, 30]
    });
    this.aircraftMarker = L.marker(startPos, { icon: aircraftIcon }).addTo(this.map);

    // Les marqueurs d'aéroports sont désormais ajoutés uniquement via addAirportMarkersIfDemo()
    this.isLoadingMap = false;
  }

  private updateFlightPath() {
    if (!this.map || !this.segments || this.segments.length < 2) return;
    // Supprimer l'ancienne polyline si besoin
    if (this.flightPath) {
      this.flightPath.remove();
    }
    const latlngs = this.segments.map(pt => [pt.lat, pt.lon] as [number, number]);
    this.flightPath = L.polyline(latlngs, {
      color: 'blue',
      weight: 3,
      opacity: 0.5
    }).addTo(this.map);
    // Ajuster la vue
    this.map.fitBounds(this.flightPath.getBounds(), {
      padding: [50, 50]
    });
    // Placer l'avion au début si pas encore positionné
    if (this.aircraftMarker && latlngs.length > 0) {
      this.aircraftMarker.setLatLng(latlngs[0]);
    }
    // Ajout des marqueurs aéroports si mode DEMO
    this.addAirportMarkersIfDemo();
  }

  private updateAircraftPosition(position: { lat: number; lng: number } | null) {
    if (!position || !this.aircraftMarker) return;
    this.aircraftMarker.setLatLng([position.lat, position.lng]);
  }

  private updatePOIs(pois: POI[]) {
    if (!this.map) return;
    // Supprimer les anciens marqueurs
    this.poiMarkers.forEach(marker => marker.remove());
    this.poiMarkers = [];

    // Ajouter les nouveaux marqueurs
    pois.forEach(poi => {
      const marker = L.marker([poi.position.lat, poi.position.lng], {
        title: poi.name
      }).addTo(this.map);

      marker.bindPopup(`
        <strong>${poi.name}</strong><br>
        ${poi.description}
      `);

      this.poiMarkers.push(marker);
    });
  }

  // Ajout de la méthode updateZoom
  updateZoom(level: number) {
    if (this.map) {
      if (level === 0) {
        // Ajuster la vue pour montrer tout le trajet
        this.map.fitBounds(this.flightPath.getBounds(), {
          padding: [50, 50]
        });
      } else {
        this.map.setZoom(level);
      }
    }
  }

  private addAirportMarkersIfDemo() {
    console.log('[DEBUG] addAirportMarkersIfDemo called, mode:', this.currentMode, 'map:', !!this.map);
    if (this.currentMode !== 'DEMO' || !this.map) return;
    // Supprimer les anciens marqueurs si besoin
    if (this.departureMarker) { this.departureMarker.remove(); }
    if (this.arrivalMarker) { this.arrivalMarker.remove(); }
    // Icône aéroport
    const airportIcon = L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzJjM2U1MCIgZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDEgMC04LTMuNTktOC04czMuNTktOCA4LTggOCAzLjU5IDggOC0zLjU5IDgtOCA4eiIvPjxwYXRoIGZpbGw9IiMyYzNlNTAiIGQ9Ik0xMiA2Yy0zLjMxIDAtNiAyLjY5LTYgNnMyLjY5IDYgNiA2IDYtMi42OSA2LTYtMi42OS02LTYtNnptMCAxMGMtMi4yMSAwLTQtMS43OS00LTRzMS43OS00IDQtNCA0IDEuNzkgNCA0LTEuNzkgNC00IDR6Ii8+PC9zdmc+',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12]
    });
    // Genève (GVA)
    const geneva = { lat: 46.2382, lng: 6.1089 };
    this.departureMarker = L.marker(geneva, { icon: airportIcon, title: 'Genève (GVA)' }).addTo(this.map);
    console.log('[DEBUG] Marqueur Genève ajouté', this.departureMarker);
    this.departureMarker.bindPopup('<b>Genève (GVA)</b><br>Aéroport de départ');
    // Athènes (ATH)
    const athens = { lat: 37.9838, lng: 23.7275 };
    this.arrivalMarker = L.marker(athens, { icon: airportIcon, title: 'Athènes (ATH)' }).addTo(this.map);
    console.log('[DEBUG] Marqueur Athènes ajouté', this.arrivalMarker);
    this.arrivalMarker.bindPopup('<b>Athènes (ATH)</b><br>Aéroport d\'arrivée');
  }

  private async loadSegmentsForMode(mode: string) {
    if (mode === 'REAL') {
      // Implement real mode loading logic
    } else if (mode === 'DISCONNECTED') {
      // Calculer un grand cercle simulé
      const start: [number, number] = [46.2382, 6.1089]; // Genève
      const end: [number, number] = [37.9838, 23.7275]; // Athènes
      const points = this.trajectoryService.computeGreatCircle(start, end, 200)
        .map(pt => ({
          lat: pt.lat,
          lon: pt.lng,
          alt: pt.alt,
          vel: pt.spd,
          time: pt.ts
        }));
      this.windowService.setSimulatedSegments(points);
    } else if (mode === 'DEMO') {
      // Charger la trajectoire démo
      const points = (await this.trajectoryService.loadDemoTrajectory())
        .map(pt => ({
          lat: pt.lat,
          lon: pt.lng,
          alt: pt.alt,
          vel: pt.spd,
          time: pt.ts
        }));
      this.windowService.setDemoSegments(points);
      this.addAirportMarkersIfDemo();
    }
  }
} 