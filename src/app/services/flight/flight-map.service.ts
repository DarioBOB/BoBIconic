import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { FlightData, Waypoint } from './models/flight.interface';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  private currentPosition?: [number, number];
  private currentFlightData = new BehaviorSubject<FlightData | null>(null);
  private currentPercent: number = 0;
  private DEFAULT_PLANE_ASSET_PATH = environment.planeAssetPath || 'assets/plane_';
  private DEFAULT_MAP_CENTER = environment.defaultMapCenter || [44, 15];
  private DEFAULT_MAP_ZOOM = environment.defaultMapZoom || 6;

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
    if (!this.map) return;

    this.clearMap();
    this.currentFlightData.next(flightData);

    // Créer les marqueurs d'aéroports
    this.createAirportMarkers(flightData);
    
    // Créer le trajet de vol
    this.createFlightPath(flightData.waypoints);

    // Centrer la carte sur le trajet
    this.centerMapOnRoute(flightData.waypoints);
  }

  private createAirportMarkers(flightData: FlightData): void {
    if (!this.map) return;

    // Icônes personnalisées
    const departureIcon = L.icon({
      iconUrl: 'assets/icons/departure-airport.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
    const arrivalIcon = L.icon({
      iconUrl: 'assets/icons/arrival-airport.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
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

    // Popups
    this.departureMarker.bindPopup(`<b>${flightData.departure.name}</b><br>${flightData.departure.code}`);
    this.arrivalMarker.bindPopup(`<b>${flightData.arrival.name}</b><br>${flightData.arrival.code}`);
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

    const rounded = Math.round(heading / 15) * 15;
    const normalized = (rounded + 360) % 360;
    const pad = (n: number) => n.toString().padStart(3, '0');
    const planeImagePath = `${this.DEFAULT_PLANE_ASSET_PATH}${pad(normalized)}deg.png`;

    this.planeMarker = L.marker(position, {
      icon: L.icon({
        iconUrl: planeImagePath,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
      })
    }).addTo(this.map);

    this.currentPosition = position;
    this.map.panTo(position);
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
      this.displayFlight(this.currentFlightData.value);
    }
  }

  public forceRefresh() {
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }
} 