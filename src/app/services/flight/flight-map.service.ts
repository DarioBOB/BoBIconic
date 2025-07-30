import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { FlightData, Waypoint } from './models/flight.interface';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { POIService, POIVisibility } from '../poi/poi.service';
import { POIIconService } from '../poi/poi-icon.service';

@Injectable({
  providedIn: 'root'
})
export class FlightMapService {
  private map?: L.Map;
  private flightPath?: L.Polyline;
  private completedPath?: L.Polyline;
  private remainingPath?: L.Polyline;
  private departureMarker?: L.Marker;
  private arrivalMarker?: L.Marker;
  private planeMarker?: L.Marker;
  private poiMarkers: L.Marker[] = [];
  private currentPosition?: [number, number];
  private currentFlightData = new BehaviorSubject<FlightData | null>(null);
  private currentPercent: number = 0;
  private currentPOIs = new BehaviorSubject<POIVisibility[]>([]);
  private DEFAULT_PLANE_ASSET_PATH = environment.planeAssetPath || 'assets/plane_';
  private DEFAULT_MAP_CENTER: L.LatLngTuple = [44, 15];
  private DEFAULT_MAP_ZOOM = environment.defaultMapZoom || 6;

  constructor(
    private poiService: POIService,
    private poiIconService: POIIconService
  ) {}

  createMap(containerId: string): L.Map {
    // Forcer l'initialisation de la carte
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);

    this.map = L.map(containerId, {
      center: this.DEFAULT_MAP_CENTER,
      zoom: this.DEFAULT_MAP_ZOOM,
      zoomControl: true,
      attributionControl: false
    });
    
    // Ajouter la couche satellite
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri',
      maxZoom: 19
    }).addTo(this.map);

    // Ajouter les contrôles de zoom
    L.control.zoom({
      position: 'bottomright'
    }).addTo(this.map);

    return this.map;
  }

  displayFlight(flightData: FlightData): void {
    if (!this.map) {
      console.warn('FlightMapService: Carte non initialisée');
      return;
    }

    console.log('FlightMapService: Affichage du vol', flightData);
    this.clearMap();
    this.currentFlightData.next(flightData);

    // Créer les marqueurs d'aéroports
    this.createAirportMarkers(flightData);
    
    // Créer le trajet de vol avec la progression actuelle
    this.updateFlightPath(this.currentPercent, flightData.waypoints);

    // Calculer et afficher la position de l'avion
    const position = this.calculatePlanePosition(this.currentPercent, flightData.waypoints);
    if (position) {
      const heading = this.calculateHeading(this.currentPercent, flightData.waypoints);
      this.updatePlanePosition(position, heading);
      
      // Calculer et afficher les POIs visibles
      this.updatePOIMarkers(position, heading);
    }

    // Centrer la carte sur le trajet
    this.centerMapOnRoute(flightData.waypoints);
  }

  private createAirportMarkers(flightData: FlightData): void {
    if (!this.map) return;

    console.log('FlightMapService: Création des marqueurs d\'aéroports', {
      departure: flightData.departure,
      arrival: flightData.arrival
    });

    // Créer des icônes SVG pour les aéroports
    const departureIcon = L.divIcon({
      className: 'airport-marker departure',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: #4CAF50;
          border: 2px solid #2E7D32;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">D</div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const arrivalIcon = L.divIcon({
      className: 'airport-marker arrival',
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: #F44336;
          border: 2px solid #C62828;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">A</div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Marqueur de départ
    this.departureMarker = L.marker(
      [flightData.departure.latitude, flightData.departure.longitude],
      { icon: departureIcon }
    ).addTo(this.map);

    // Marqueur d'arrivée
    this.arrivalMarker = L.marker(
      [flightData.arrival.latitude, flightData.arrival.longitude],
      { icon: arrivalIcon }
    ).addTo(this.map);

    // Popups avec plus d'informations
    this.departureMarker.bindPopup(`
      <div style="text-align: center;">
        <strong>🛫 Départ</strong><br>
        <b>${flightData.departure.name}</b><br>
        Code: ${flightData.departure.code}
      </div>
    `);
    
    this.arrivalMarker.bindPopup(`
      <div style="text-align: center;">
        <strong>🛬 Arrivée</strong><br>
        <b>${flightData.arrival.name}</b><br>
        Code: ${flightData.arrival.code}
      </div>
    `);
  }

  private createFlightPath(waypoints: Waypoint[]): void {
    if (!this.map || waypoints.length === 0) return;

    // Points du trajet
    const points = waypoints.map(wp => [wp.latitude, wp.longitude] as L.LatLngTuple);

    // Calcul de l'index de progression
    const progressIdx = Math.floor(this.currentPercent / 100 * (points.length - 1));

    // Partie parcourue (trait plein)
    const completedPoints = points.slice(0, progressIdx + 1);
    if (this.completedPath) this.map.removeLayer(this.completedPath);
    this.completedPath = L.polyline(completedPoints, {
      color: '#4CAF50',
      weight: 4,
      opacity: 0.9
    }).addTo(this.map);

    // Partie restante (pointillés)
    const remainingPoints = points.slice(progressIdx);
    if (this.remainingPath) this.map.removeLayer(this.remainingPath);
    this.remainingPath = L.polyline(remainingPoints, {
      color: '#F44336',
      weight: 4,
      opacity: 0.7,
      dashArray: '8, 12'
    }).addTo(this.map);
  }

  private getProgress(): number {
    // À implémenter : calculer le pourcentage de progression du vol
    return 0.5; // Pour l'exemple
  }

  private clearMap(): void {
    if (this.completedPath) this.map?.removeLayer(this.completedPath);
    if (this.remainingPath) this.map?.removeLayer(this.remainingPath);
    if (this.departureMarker) this.map?.removeLayer(this.departureMarker);
    if (this.arrivalMarker) this.map?.removeLayer(this.arrivalMarker);
    if (this.planeMarker) this.map?.removeLayer(this.planeMarker);
    
    // Supprimer les marqueurs POI
    this.clearPOIMarkers();
  }

  private clearPOIMarkers(): void {
    if (this.map) {
      this.poiMarkers.forEach(marker => {
        this.map!.removeLayer(marker);
      });
    }
    this.poiMarkers = [];
  }

  private updatePOIMarkers(position: [number, number], heading: number): void {
    if (!this.map) return;

    // Supprimer les anciens marqueurs POI
    this.clearPOIMarkers();

    // Calculer l'altitude de l'avion selon la progression
    const altitude = this.calculatePlaneAltitude(this.currentPercent);
    
    // Calculer les POIs visibles
    const visiblePOIs = this.poiService.calculatePOIVisibility(
      position[0], position[1], altitude, 500 // 500km de rayon
    );

    // Filtrer les POIs selon le côté (gauche/droite) par rapport au cap de l'avion
    const filteredPOIs = visiblePOIs.filter(poiVisibility => {
      return this.poiService.isPOIOnSide(poiVisibility.azimuth, heading, poiVisibility.poi.side);
    });

    // Limiter aux 10 POIs les plus proches
    const topPOIs = filteredPOIs.slice(0, 10);

    console.log('FlightMapService: POIs visibles calculés', {
      totalPOIs: visiblePOIs.length,
      filteredPOIs: filteredPOIs.length,
      topPOIs: topPOIs.length,
      planePosition: position,
      planeHeading: heading,
      planeAltitude: altitude
    });

    // Créer les marqueurs pour les POIs visibles
    topPOIs.forEach(poiVisibility => {
      const marker = this.createPOIMarker(poiVisibility);
      if (marker) {
        this.poiMarkers.push(marker);
        marker.addTo(this.map!);
      }
    });

    // Mettre à jour le BehaviorSubject pour les composants qui écoutent
    this.currentPOIs.next(topPOIs);
  }

  private createPOIMarker(poiVisibility: POIVisibility): L.Marker | null {
    if (!this.map) return null;

    const { poi, isVisible, distance, elevationAngle } = poiVisibility;
    
    // Créer une icône colorée selon le type et la visibilité
    const iconColor = this.poiIconService.getColorForVisibility(poi.type, isVisible);
    const iconSize = isVisible ? 20 : 16; // Plus grand si visible
    
    const icon = L.divIcon({
      className: `poi-marker ${poi.type} ${isVisible ? 'visible' : 'hidden'}`,
      html: `
        <div style="
          width: ${iconSize}px;
          height: ${iconSize}px;
          background: ${iconColor};
          border: 2px solid ${isVisible ? '#fff' : '#666'};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${isVisible ? '10px' : '8px'};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ${isVisible ? 'animation: pulse 2s infinite;' : ''}
        ">${this.poiIconService.getIcon(poi.type)}</div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        </style>
      `,
      iconSize: [iconSize, iconSize],
      iconAnchor: [iconSize / 2, iconSize / 2]
    });

    const marker = L.marker([poi.lat, poi.lon], { icon }).addTo(this.map!);
    
    // Popup avec informations détaillées
    const popupContent = `
      <div style="text-align: center; min-width: 200px;">
        <strong style="color: ${iconColor};">${poi.name}</strong><br>
        <small>${poi.description}</small><br>
        <div style="margin: 8px 0;">
          <span style="color: ${isVisible ? '#4CAF50' : '#999'};">
            ${isVisible ? '👁️ Visible' : '👁️‍🗨️ Caché'}
          </span>
        </div>
        <div style="font-size: 12px; color: #666;">
          Distance: ${distance.toFixed(1)} km<br>
          Élévation: ${elevationAngle.toFixed(1)}°<br>
          Altitude: ${poi.altitude || 0} m<br>
          Type: ${poi.type}
        </div>
        <div style="margin-top: 8px;">
          <a href="${poi.wiki_url}" target="_blank" style="color: #1976d2; text-decoration: none;">
            📖 Wikipedia
          </a>
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    return marker;
  }



  private calculatePlaneAltitude(percent: number): number {
    // Profil d'altitude réaliste : montée, croisière, descente
    if (percent < 10) {
      // Montée : 0 à 35000 ft en 10% du trajet
      return (percent / 10) * 35000;
    } else if (percent > 90) {
      // Descente : 35000 à 0 ft dans les 10% finaux
      return ((100 - percent) / 10) * 35000;
    } else {
      // Croisière : 35000 ft
      return 35000;
    }
  }

  private centerMapOnRoute(waypoints: Waypoint[]): void {
    if (!this.map || waypoints.length === 0) return;

    const bounds = L.latLngBounds(waypoints.map(wp => [wp.latitude, wp.longitude]));
    this.map.fitBounds(bounds, {
      padding: [50, 50]
    });
  }

  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  updatePlanePosition(position: [number, number], heading: number): void {
    if (!this.map) return;

    if (this.planeMarker) {
      this.map.removeLayer(this.planeMarker);
    }

    // Utiliser les icônes d'avion orientées existantes
    const rounded = Math.round(heading / 15) * 15;
    const normalized = (rounded + 360) % 360;
    const pad = (n: number) => n.toString().padStart(3, '0');
    const planeImagePath = `assets/plane_${pad(normalized)}deg.png`;

    console.log('FlightMapService: Utilisation de l\'icône d\'avion', {
      heading,
      rounded,
      normalized,
      planeImagePath
    });

    // Créer l'icône d'avion orientée
    const planeIcon = L.icon({
        iconUrl: planeImagePath,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });

    this.planeMarker = L.marker(position, {
      icon: planeIcon
    }).addTo(this.map);

    // Ajouter un popup avec les informations
    this.planeMarker.bindPopup(`
      <div style="text-align: center;">
        <strong>✈️ Avion</strong><br>
        Progression: ${this.currentPercent.toFixed(1)}%<br>
        Cap: ${heading.toFixed(0)}°
      </div>
    `);

    this.currentPosition = position;
    
    // Centrer la carte sur l'avion si la progression est > 0
    if (this.currentPercent > 0) {
    this.map.panTo(position);
    }
  }

  updateFlightData(flightData: FlightData): void {
    this.currentFlightData.next(flightData);
    this.updateMap(flightData);
  }

  private updateMap(flightData: FlightData): void {
    if (!this.map) return;

    // Mettre à jour les marqueurs d'aéroports
    this.updateAirportMarkers(flightData);

    // Mettre à jour la ligne de trajet
    this.updateRouteLine(flightData);

    // Mettre à jour le marqueur de l'avion
    this.updateAircraftMarker(flightData);

    // Ajuster la vue de la carte
    this.fitMapToFlight(flightData);
  }

  private updateAirportMarkers(flightData: FlightData): void {
    if (!this.map) return;

    // Supprimer les anciens marqueurs
    if (this.departureMarker) {
      this.map.removeLayer(this.departureMarker);
    }
    if (this.arrivalMarker) {
      this.map.removeLayer(this.arrivalMarker);
    }

    // Créer les nouveaux marqueurs
    this.departureMarker = L.marker(
      [flightData.departure.latitude, flightData.departure.longitude],
      { icon: this.createAirportIcon('departure') }
    ).addTo(this.map);
    this.departureMarker.bindPopup(`<b>${flightData.departure.name}</b><br>${flightData.departure.code}`);

    this.arrivalMarker = L.marker(
      [flightData.arrival.latitude, flightData.arrival.longitude],
      { icon: this.createAirportIcon('arrival') }
    ).addTo(this.map);
    this.arrivalMarker.bindPopup(`<b>${flightData.arrival.name}</b><br>${flightData.arrival.code}`);
  }

  private updateRouteLine(flightData: FlightData): void {
    if (!this.map) return;

    // Supprimer l'ancienne ligne
    if (this.completedPath) {
      this.map.removeLayer(this.completedPath);
    }
    if (this.remainingPath) {
      this.map.removeLayer(this.remainingPath);
    }

    // Créer la nouvelle ligne
    if (flightData.waypoints.length > 0) {
      const points = flightData.waypoints.map(wp => [wp.latitude, wp.longitude] as L.LatLngTuple);
      this.createFlightPath(flightData.waypoints);
    }
  }

  private updateAircraftMarker(flightData: FlightData): void {
    if (!this.map) return;

    // Supprimer l'ancien marqueur
    if (this.planeMarker) {
      this.map.removeLayer(this.planeMarker);
    }

    // Créer le nouveau marqueur
    if (flightData.currentPosition) {
      const { latitude, longitude, heading } = flightData.currentPosition;
      this.planeMarker = L.marker([latitude, longitude], {
        icon: this.createAircraftIcon(heading)
      }).addTo(this.map);

      this.planeMarker.bindPopup(this.createAircraftPopup(flightData));
    }
  }

  private fitMapToFlight(flightData: FlightData): void {
    if (!this.map) return;

    const bounds: L.LatLngTuple[] = [];

    // Ajouter les aéroports
    bounds.push([flightData.departure.latitude, flightData.departure.longitude]);
    bounds.push([flightData.arrival.latitude, flightData.arrival.longitude]);

    // Ajouter la position actuelle de l'avion
    if (flightData.currentPosition) {
      bounds.push([
        flightData.currentPosition.latitude,
        flightData.currentPosition.longitude
      ]);
    }

    // Ajuster la vue
    if (bounds.length > 0) {
      this.map.fitBounds(bounds as L.LatLngBoundsExpression, {
        padding: [50, 50]
      });
    }
  }

  private createAirportIcon(type: 'departure' | 'arrival'): L.Icon {
    return L.icon({
      iconUrl: `assets/icons/${type}-airport.png`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  }

  private createAircraftIcon(heading: number): L.Icon {
    const rounded = Math.round(heading / 15) * 15;
    const normalized = (rounded + 360) % 360;
    const pad = (n: number) => n.toString().padStart(3, '0');
    const planeImagePath = `${this.DEFAULT_PLANE_ASSET_PATH}${pad(normalized)}deg.png`;

    return L.icon({
      iconUrl: planeImagePath,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  }

  private createAircraftPopup(flightData: FlightData): string {
    const currentPosition = flightData.currentPosition;
    return `
      <div class="aircraft-popup">
        <h3>${flightData.flightNumber}</h3>
        <p>Compagnie: ${flightData.airline}</p>
        ${currentPosition ? `
          <div class="position-info">
            <p>Altitude: ${currentPosition.altitude} ft</p>
            <p>Cap: ${currentPosition.heading}°</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  getCurrentFlightData(): Observable<FlightData | null> {
    return this.currentFlightData.asObservable();
  }

  setProgress(percent: number) {
    this.currentPercent = percent;
    
    if (this.currentFlightData.value) {
      // Calculer la position de l'avion basée sur le pourcentage
      const flightData = this.currentFlightData.value;
      const position = this.calculatePlanePosition(percent, flightData.waypoints);
      
      if (position) {
        const heading = this.calculateHeading(percent, flightData.waypoints);
        
        // Mettre à jour le tracé
        this.updateFlightPath(percent, flightData.waypoints);
        
        // Mettre à jour la position de l'avion
        this.updatePlanePosition(position, heading);
        
        // Mettre à jour les POIs visibles
        this.updatePOIMarkers(position, heading);
      }
    }
  }

  private calculatePlanePosition(percent: number, waypoints: Waypoint[]): [number, number] | null {
    if (waypoints.length < 2) return null;
    
    // Interpolation linéaire entre les waypoints
    const totalDistance = waypoints.length - 1;
    const currentIndex = (percent / 100) * totalDistance;
    
    const startIndex = Math.floor(currentIndex);
    const endIndex = Math.min(startIndex + 1, waypoints.length - 1);
    const fraction = currentIndex - startIndex;
    
    const start = waypoints[startIndex];
    const end = waypoints[endIndex];
    
    const lat = start.latitude + (end.latitude - start.latitude) * fraction;
    const lng = start.longitude + (end.longitude - start.longitude) * fraction;
    
    return [lat, lng];
  }

  private calculateHeading(percent: number, waypoints: Waypoint[]): number {
    if (waypoints.length < 2) return 0;
    
    const totalDistance = waypoints.length - 1;
    const currentIndex = (percent / 100) * totalDistance;
    
    const startIndex = Math.floor(currentIndex);
    const endIndex = Math.min(startIndex + 1, waypoints.length - 1);
    
    const start = waypoints[startIndex];
    const end = waypoints[endIndex];
    
    // Calculer l'azimut entre les deux points
    const deltaLng = end.longitude - start.longitude;
    const deltaLat = end.latitude - start.latitude;
    
    const heading = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
    return (heading + 360) % 360;
    }

  private updateFlightPath(percent: number, waypoints: Waypoint[]): void {
    if (!this.map || waypoints.length === 0) {
      console.warn('FlightMapService: Impossible de mettre à jour le tracé', { map: !!this.map, waypointsLength: waypoints.length });
      return;
    }

    console.log('FlightMapService: Mise à jour du tracé', { percent, waypoints });

    // Points du trajet
    const points = waypoints.map(wp => [wp.latitude, wp.longitude] as L.LatLngTuple);

    // Calcul de l'index de progression
    const progressIdx = Math.floor(percent / 100 * (points.length - 1));

    // Partie parcourue (trait plein vert)
    const completedPoints = points.slice(0, progressIdx + 1);
    if (this.completedPath) this.map.removeLayer(this.completedPath);
    if (completedPoints.length > 1) {
      this.completedPath = L.polyline(completedPoints, {
        color: '#4CAF50',
        weight: 4,
        opacity: 0.9
      }).addTo(this.map);
    }

    // Partie restante (pointillés rouges)
    const remainingPoints = points.slice(progressIdx);
    if (this.remainingPath) this.map.removeLayer(this.remainingPath);
    if (remainingPoints.length > 1) {
      this.remainingPath = L.polyline(remainingPoints, {
        color: '#F44336',
        weight: 4,
        opacity: 0.7,
        dashArray: '8, 12'
      }).addTo(this.map);
    }
  }

  getCurrentPOIs(): Observable<POIVisibility[]> {
    return this.currentPOIs.asObservable();
  }

  public forceRefresh() {
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }
} 