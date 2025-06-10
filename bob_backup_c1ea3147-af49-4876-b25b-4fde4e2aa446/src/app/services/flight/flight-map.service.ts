import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { FlightData, Waypoint } from './models/flight.interface';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FlightMapService {
  private map?: L.Map;
  private flightPath?: L.Polyline;
  private departureMarker?: L.Marker;
  private arrivalMarker?: L.Marker;
  private planeMarker?: L.Marker;
  private currentPosition?: [number, number];
  private currentFlightData = new BehaviorSubject<FlightData | null>(null);

  createMap(containerId: string): L.Map {
    this.map = L.map(containerId).setView([44, 15], 6);
    
    // Ajouter la couche satellite
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri'
    }).addTo(this.map);

    // Ajouter les contrôles de zoom
    L.control.zoom({
      position: 'bottomright'
    }).addTo(this.map);

    return this.map;
  }

  displayFlight(flightData: FlightData): void {
    if (!this.map) return;

    // Nettoyer les marqueurs existants
    this.clearMap();

    // Créer la ligne de vol
    this.createFlightPath(flightData.route.waypoints);

    // Ajouter les marqueurs d'aéroports
    this.createAirportMarkers(flightData);

    // Centrer la carte sur le trajet
    this.centerMapOnRoute(flightData.route.waypoints);
  }

  private clearMap(): void {
    if (this.flightPath) this.map?.removeLayer(this.flightPath);
    if (this.departureMarker) this.map?.removeLayer(this.departureMarker);
    if (this.arrivalMarker) this.map?.removeLayer(this.arrivalMarker);
    if (this.planeMarker) this.map?.removeLayer(this.planeMarker);
  }

  private createFlightPath(waypoints: Waypoint[]): void {
    if (!this.map) return;

    const pathPoints = waypoints.map(wp => [wp.lat, wp.lon] as [number, number]);
    
    this.flightPath = L.polyline(pathPoints, {
      color: 'red',
      weight: 3,
      dashArray: '8,8',
      opacity: 0.8
    }).addTo(this.map);

    // Ajouter les popups pour chaque point
    waypoints.forEach((wp, index) => {
      const marker = L.circleMarker([wp.lat, wp.lon], {
        radius: 3,
        color: 'white',
        fillColor: 'red',
        fillOpacity: 1
      }).addTo(this.map!);

      marker.bindPopup(`
        <div>
          <strong>Point ${index + 1}</strong><br>
          Altitude: ${wp.altitude}ft<br>
          Heure: ${new Date(wp.timestamp).toLocaleTimeString()}
        </div>
      `);
    });
  }

  private createAirportMarkers(flightData: FlightData): void {
    if (!this.map) return;

    // Marqueur de départ
    this.departureMarker = L.marker([flightData.route.waypoints[0].lat, flightData.route.waypoints[0].lon], {
      icon: L.divIcon({
        className: 'airport-marker departure',
        html: `<div class="airport-icon departure">${flightData.departure.code}</div>`
      })
    }).addTo(this.map);

    // Marqueur d'arrivée
    const lastPoint = flightData.route.waypoints[flightData.route.waypoints.length - 1];
    this.arrivalMarker = L.marker([lastPoint.lat, lastPoint.lon], {
      icon: L.divIcon({
        className: 'airport-marker arrival',
        html: `<div class="airport-icon arrival">${flightData.arrival.code}</div>`
      })
    }).addTo(this.map);

    // Ajouter les popups avec les informations
    this.departureMarker.bindPopup(this.createAirportPopup(flightData.departure));
    this.arrivalMarker.bindPopup(this.createAirportPopup(flightData.arrival));
  }

  private createAirportPopup(airport: any): string {
    return `
      <div class="airport-popup">
        <h3>${airport.name} (${airport.code})</h3>
        <p>Terminal: ${airport.terminal}</p>
        <p>Porte: ${airport.gate}</p>
        <p>Heure prévue: ${airport.scheduledTime}</p>
        <p>Retard moyen: ${airport.averageDelay} min</p>
        <p>Bagages: Tapis ${airport.baggageClaim}</p>
      </div>
    `;
  }

  private centerMapOnRoute(waypoints: Waypoint[]): void {
    if (!this.map || waypoints.length === 0) return;

    const bounds = L.latLngBounds(waypoints.map(wp => [wp.lat, wp.lon]));
    this.map.fitBounds(bounds, {
      padding: [50, 50]
    });
  }

  updatePlanePosition(position: [number, number], heading: number): void {
    if (!this.map) return;

    if (this.planeMarker) {
      this.map.removeLayer(this.planeMarker);
    }

    const rounded = Math.round(heading / 15) * 15;
    const normalized = (rounded + 360) % 360;
    const pad = (n: number) => n.toString().padStart(3, '0');
    const planeImagePath = `assets/plane_${pad(normalized)}deg.png`;

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

  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
    this.currentFlightData.next(null);
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
    if (flightData.departure.location) {
      this.departureMarker = L.marker(
        [flightData.departure.location.latitude, flightData.departure.location.longitude],
        {
          icon: this.createAirportIcon('departure')
        }
      ).addTo(this.map);

      this.departureMarker.bindPopup(this.createAirportPopup(flightData.departure));
    }

    if (flightData.arrival.location) {
      this.arrivalMarker = L.marker(
        [flightData.arrival.location.latitude, flightData.arrival.location.longitude],
        {
          icon: this.createAirportIcon('arrival')
        }
      ).addTo(this.map);

      this.arrivalMarker.bindPopup(this.createAirportPopup(flightData.arrival));
    }
  }

  private updateRouteLine(flightData: FlightData): void {
    if (!this.map) return;

    // Supprimer l'ancienne ligne
    if (this.flightPath) {
      this.map.removeLayer(this.flightPath);
    }

    // Créer la nouvelle ligne
    if (flightData.route.waypoints.length > 0) {
      const points = flightData.route.waypoints.map(wp => [wp.lat, wp.lon]);
      this.flightPath = L.polyline(points, {
        color: '#1bb6b1',
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 10'
      }).addTo(this.map);
    }
  }

  private updateAircraftMarker(flightData: FlightData): void {
    if (!this.map) return;

    // Supprimer l'ancien marqueur
    if (this.planeMarker) {
      this.map.removeLayer(this.planeMarker);
    }

    // Créer le nouveau marqueur
    if (flightData.route.currentPosition) {
      const { latitude, longitude, heading } = flightData.route.currentPosition;
      this.planeMarker = L.marker([latitude, longitude], {
        icon: this.createAircraftIcon(heading)
      }).addTo(this.map);

      this.planeMarker.bindPopup(this.createAircraftPopup(flightData));
    }
  }

  private fitMapToFlight(flightData: FlightData): void {
    if (!this.map) return;

    const bounds: L.LatLngExpression[] = [];

    // Ajouter les aéroports
    if (flightData.departure.location) {
      bounds.push([flightData.departure.location.latitude, flightData.departure.location.longitude]);
    }
    if (flightData.arrival.location) {
      bounds.push([flightData.arrival.location.latitude, flightData.arrival.location.longitude]);
    }

    // Ajouter la position actuelle de l'avion
    if (flightData.route.currentPosition) {
      bounds.push([
        flightData.route.currentPosition.latitude,
        flightData.route.currentPosition.longitude
      ]);
    }

    // Ajuster la vue
    if (bounds.length > 0) {
      this.map.fitBounds(bounds, {
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
    return L.icon({
      iconUrl: 'assets/icons/aircraft.png',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
      className: 'aircraft-icon',
      style: `transform: rotate(${heading}deg);`
    });
  }

  private createAircraftPopup(flightData: FlightData): string {
    const currentPosition = flightData.route.currentPosition;
    return `
      <div class="aircraft-popup">
        <h3>${flightData.flightNumber}</h3>
        <p>Compagnie: ${flightData.airline}</p>
        ${flightData.aircraft ? `
          <p>Appareil: ${flightData.aircraft.type} (${flightData.aircraft.registration})</p>
        ` : ''}
        ${currentPosition ? `
          <div class="position-info">
            <p>Altitude: ${currentPosition.altitude} ft</p>
            <p>Vitesse: ${currentPosition.speed} kts</p>
            <p>Cap: ${currentPosition.heading}°</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  getCurrentFlightData(): Observable<FlightData | null> {
    return this.currentFlightData.asObservable();
  }
} 