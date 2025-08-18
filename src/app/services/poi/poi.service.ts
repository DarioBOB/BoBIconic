import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface POI {
  name: string;
  description: string;
  wiki_url: string;
  lat: number;
  lon: number;
  side: 'left' | 'right';
  type: 'nature' | 'montagne' | 'ville' | 'historique' | 'eau' | 'parc' | 'plage' | 'vallee' | 'archipel' | 'port' | 'quartier' | 'colline' | 'autre';
  image_url?: string | null;
  altitude?: number; // Altitude du POI en mètres
}

export interface POIVisibility {
  poi: POI;
  isVisible: boolean;
  distance: number; // Distance en km
  elevationAngle: number; // Angle d'élévation en degrés
  azimuth: number; // Azimut en degrés
}

@Injectable({
  providedIn: 'root'
})
export class POIService {
  private pois = new BehaviorSubject<POI[]>([]);

  constructor() {
    this.initializePOIs();
  }

  private initializePOIs() {
    const initialPOIs: POI[] = [
      // France/Suisse (départ)
      { name: 'Crêt de la Neige', description: 'Point culminant du Jura, vue sur le Léman.', wiki_url: 'https://fr.wikipedia.org/wiki/Cr%C3%AAt_de_la_Neige', lat: 46.2967, lon: 5.9442, side: 'left', type: 'montagne', image_url: null, altitude: 1720 },
      { name: 'Lac Léman', description: 'Le plus grand lac alpin d\'Europe.', wiki_url: 'https://fr.wikipedia.org/wiki/L%C3%A9man', lat: 46.4542, lon: 6.6028, side: 'left', type: 'eau', image_url: null, altitude: 372 },
      { name: 'Mont Salève', description: 'Le balcon de Genève.', wiki_url: 'https://fr.wikipedia.org/wiki/Le_Sal%C3%A8ve', lat: 46.1367, lon: 6.1806, side: 'left', type: 'montagne', image_url: null, altitude: 1379 },
      { name: 'Mont Blanc', description: 'Plus haut sommet des Alpes.', wiki_url: 'https://fr.wikipedia.org/wiki/Mont_Blanc', lat: 45.8326, lon: 6.8652, side: 'right', type: 'montagne', image_url: null, altitude: 4808 },
      { name: 'Vallée de l\'Arve', description: 'Vallée glaciaire de Haute-Savoie.', wiki_url: 'https://fr.wikipedia.org/wiki/Vall%C3%A9e_de_l%27Arve', lat: 46.0500, lon: 6.6000, side: 'right', type: 'vallee', image_url: null, altitude: 1000 },
      { name: 'Chamonix', description: 'Station de montagne au pied du Mont Blanc.', wiki_url: 'https://fr.wikipedia.org/wiki/Chamonix', lat: 45.9237, lon: 6.8694, side: 'right', type: 'ville', image_url: null, altitude: 1035 },
      // Italie nord
      { name: 'Dolomites (Marmolada)', description: 'Massif alpin célèbre.', wiki_url: 'https://fr.wikipedia.org/wiki/Marmolada', lat: 46.4333, lon: 11.8667, side: 'left', type: 'montagne', image_url: null, altitude: 3343 },
      { name: 'Lac de Garde', description: 'Le plus grand lac d\'Italie.', wiki_url: 'https://fr.wikipedia.org/wiki/Lac_de_Garde', lat: 45.6500, lon: 10.6667, side: 'left', type: 'eau', image_url: null, altitude: 65 },
      { name: 'Massif de Brenta', description: 'Alpes italiennes.', wiki_url: 'https://fr.wikipedia.org/wiki/Groupe_de_Brenta', lat: 46.1833, lon: 10.9000, side: 'left', type: 'montagne', image_url: null, altitude: 3155 },
      { name: 'Plaine du Pô', description: 'Grande plaine fertile.', wiki_url: 'https://fr.wikipedia.org/wiki/Plaine_du_P%C3%B4', lat: 45.0000, lon: 10.0000, side: 'right', type: 'nature', image_url: null, altitude: 100 },
      { name: 'Vérone', description: 'Ville célèbre pour Roméo et Juliette.', wiki_url: 'https://fr.wikipedia.org/wiki/V%C3%A9rone', lat: 45.4386, lon: 10.9928, side: 'right', type: 'ville', image_url: null, altitude: 59 },
      { name: 'Mantoue', description: 'Ville d\'art en Lombardie.', wiki_url: 'https://fr.wikipedia.org/wiki/Mantoue', lat: 45.1564, lon: 10.7914, side: 'right', type: 'ville', image_url: null, altitude: 19 },
      // Italie centre/Adriatique
      { name: 'Côte adriatique', description: 'Plages et ville de Ravenne.', wiki_url: 'https://fr.wikipedia.org/wiki/Ravenne', lat: 44.4184, lon: 12.2035, side: 'left', type: 'plage', image_url: null, altitude: 4 },
      { name: 'Venise', description: 'Ville sur l\'eau.', wiki_url: 'https://fr.wikipedia.org/wiki/Venise', lat: 45.4408, lon: 12.3155, side: 'left', type: 'ville', image_url: null, altitude: 1 },
      { name: 'Delta du Pô', description: 'Zone humide protégée.', wiki_url: 'https://fr.wikipedia.org/wiki/Delta_du_P%C3%B4', lat: 44.9500, lon: 12.3667, side: 'left', type: 'nature', image_url: null, altitude: 0 },
      { name: 'Côte dalmate', description: 'Côte croate et îles.', wiki_url: 'https://fr.wikipedia.org/wiki/C%C3%B4te_dalmate', lat: 44.8000, lon: 15.0000, side: 'right', type: 'plage', image_url: null, altitude: 0 },
      { name: 'Dubrovnik', description: 'Ville fortifiée UNESCO.', wiki_url: 'https://fr.wikipedia.org/wiki/Dubrovnik', lat: 42.6507, lon: 18.0944, side: 'right', type: 'historique', image_url: null, altitude: 3 },
      { name: 'Archipel des Kornati', description: 'Parc national croate.', wiki_url: 'https://fr.wikipedia.org/wiki/Parc_national_des_Kornati', lat: 43.8200, lon: 15.3300, side: 'right', type: 'archipel', image_url: null, altitude: 0 },
      // Albanie/Grèce
      { name: 'Massif de Llogara', description: 'Montagnes du sud de l\'Albanie.', wiki_url: 'https://fr.wikipedia.org/wiki/Parc_national_de_Llogara', lat: 40.2047, lon: 19.6125, side: 'left', type: 'montagne', image_url: null, altitude: 2017 },
      { name: 'Vallée de la Vjosa', description: 'Rivière sauvage d\'Albanie.', wiki_url: 'https://fr.wikipedia.org/wiki/Vjosa', lat: 40.1000, lon: 20.0000, side: 'left', type: 'vallee', image_url: null, altitude: 200 },
      { name: 'Parc national de Butrint', description: 'Site archéologique.', wiki_url: 'https://fr.wikipedia.org/wiki/Butrint', lat: 39.7458, lon: 20.0208, side: 'left', type: 'parc', image_url: null, altitude: 0 },
      { name: 'Îles Ioniennes', description: 'Archipel grec.', wiki_url: 'https://fr.wikipedia.org/wiki/%C3%8Eles_Ioniennes', lat: 39.6243, lon: 19.9217, side: 'right', type: 'archipel', image_url: null, altitude: 0 },
      { name: 'Golfe de Patras', description: 'Golfe de la mer Ionienne.', wiki_url: 'https://fr.wikipedia.org/wiki/Golfe_de_Patras', lat: 38.3333, lon: 21.7333, side: 'right', type: 'eau', image_url: null, altitude: 0 },
      { name: 'Côtes de l\'Épire', description: 'Région côtière montagneuse.', wiki_url: 'https://fr.wikipedia.org/wiki/%C3%89pire_(p%C3%A9riphr%C3%A9rie)', lat: 39.2000, lon: 20.6000, side: 'right', type: 'nature', image_url: null, altitude: 500 },
      // Grèce (arrivée)
      { name: 'Golfe Saronique', description: 'Golfe maritime au sud d\'Athènes.', wiki_url: 'https://fr.wikipedia.org/wiki/Golfe_Saronique', lat: 37.8000, lon: 23.4000, side: 'left', type: 'eau', image_url: null, altitude: 0 },
      { name: 'Mont Hymette', description: 'Montagne au sud-est d\'Athènes.', wiki_url: 'https://fr.wikipedia.org/wiki/Hymette', lat: 37.9333, lon: 23.8167, side: 'left', type: 'montagne', image_url: null, altitude: 1026 },
      { name: 'Port du Pirée', description: 'Principal port d\'Athènes.', wiki_url: 'https://fr.wikipedia.org/wiki/Le_Pir%C3%A9e', lat: 37.9421, lon: 23.6465, side: 'left', type: 'port', image_url: null, altitude: 0 },
      { name: 'Acropole et Parthénon', description: 'Site antique emblématique.', wiki_url: 'https://fr.wikipedia.org/wiki/Acropole_d%27Ath%C3%A8nes', lat: 37.9715, lon: 23.7267, side: 'right', type: 'historique', image_url: null, altitude: 156 },
      { name: 'Quartier de Plaka', description: 'Quartier historique d\'Athènes.', wiki_url: 'https://fr.wikipedia.org/wiki/Pl%C3%A1ka', lat: 37.9747, lon: 23.7283, side: 'right', type: 'quartier', image_url: null, altitude: 100 },
      { name: 'Mont Lycabette', description: 'Colline dominant Athènes.', wiki_url: 'https://fr.wikipedia.org/wiki/Mont_Lycabette', lat: 37.9908, lon: 23.7439, side: 'right', type: 'colline', image_url: null, altitude: 277 }
    ];
    this.pois.next(initialPOIs);
  }

  getPOIs(): Observable<POI[]> {
    return this.pois.asObservable();
  }

  getPOIsBySide(side: 'left' | 'right'): POI[] {
    return this.pois.value.filter(poi => poi.side === side);
  }

  getPOIsByType(type: POI['type']): POI[] {
    return this.pois.value.filter(poi => poi.type === type);
  }

  getPOIsInRange(lat: number, lon: number, rangeKm: number): POI[] {
    return this.pois.value.filter(poi => {
      const distance = this.calculateDistance(lat, lon, poi.lat, poi.lon);
      return distance <= rangeKm;
    });
  }

  /**
   * Calcule la visibilité des POIs depuis la position de l'avion
   */
  calculatePOIVisibility(
    planeLat: number, 
    planeLon: number, 
    planeAltitude: number, // en pieds
    rangeKm: number = 500
  ): POIVisibility[] {
    const pois = this.getPOIsInRange(planeLat, planeLon, rangeKm);
    const results: POIVisibility[] = [];

    for (const poi of pois) {
      const distance = this.calculateDistance(planeLat, planeLon, poi.lat, poi.lon);
      const elevationAngle = this.calculateElevationAngle(
        planeLat, planeLon, planeAltitude,
        poi.lat, poi.lon, poi.altitude || 0
      );
      const azimuth = this.calculateAzimuth(planeLat, planeLon, poi.lat, poi.lon);
      
      // Un POI est visible si l'angle d'élévation > -5° (au-dessus de l'horizon)
      const isVisible = elevationAngle > -5;

      results.push({
        poi,
        isVisible,
        distance,
        elevationAngle,
        azimuth
      });
    }

    // Trier par distance croissante
    return results.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calcule l'angle d'élévation d'un POI depuis l'avion
   */
  private calculateElevationAngle(
    planeLat: number, planeLon: number, planeAltitude: number, // en pieds
    poiLat: number, poiLon: number, poiAltitude: number // en mètres
  ): number {
    const distance = this.calculateDistance(planeLat, planeLon, poiLat, poiLon) * 1000; // en mètres
    const planeAltitudeM = planeAltitude * 0.3048; // conversion pieds -> mètres
    const heightDifference = poiAltitude - planeAltitudeM;
    
    // Angle d'élévation = arctan(différence de hauteur / distance horizontale)
    const elevationAngle = Math.atan2(heightDifference, distance) * (180 / Math.PI);
    
    return elevationAngle;
  }

  /**
   * Calcule l'azimut (direction) d'un POI depuis l'avion
   */
  private calculateAzimuth(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let azimuth = Math.atan2(y, x) * (180 / Math.PI);
    azimuth = (azimuth + 360) % 360; // Normaliser entre 0 et 360
    
    return azimuth;
  }

  /**
   * Détermine si un POI est à gauche ou à droite de l'avion selon son cap
   */
  isPOIOnSide(poiAzimuth: number, planeHeading: number, side: 'left' | 'right'): boolean {
    const relativeAzimuth = (poiAzimuth - planeHeading + 360) % 360;
    
    if (side === 'left') {
      return relativeAzimuth >= 270 || relativeAzimuth <= 90;
    } else {
      return relativeAzimuth >= 90 && relativeAzimuth <= 270;
    }
  }

  /**
   * Calcule le zoom de carte optimal selon l'altitude
   */
  getMapZoomFromAltitude(altitude: number): number {
    const minAlt = 0;
    const maxAlt = 40000;
    const minZoom = 6;
    const maxZoom = 13;
    const alt = Math.max(minAlt, Math.min(maxAlt, altitude));
    const zoom = maxZoom - ((alt - minAlt) / (maxAlt - minAlt)) * (maxZoom - minZoom);
    return Math.round(zoom);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
} 