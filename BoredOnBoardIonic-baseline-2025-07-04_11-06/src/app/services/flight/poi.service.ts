import { Injectable } from '@angular/core';
import { POI, POISegment, POIType, POISide, POIGeneratorConfig } from './models/poi.interface';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class POIService {
    private readonly POI_TYPES: POIType[] = [
        'Montagne', 'Lac', 'Village', 'Forêt', 'Monument', 
        'Point de vue', 'Ville', 'Site historique'
    ];

    private readonly WIKI_API_URL = 'https://fr.wikipedia.org/w/api.php';

    constructor(private http: HttpClient) {}

    /**
     * Génère les POIs pour une tranche de 10%
     */
    generatePOIsForSegment(
        baseLat: number,
        baseLng: number,
        altitude: number,
        percent: number
    ): Observable<POISegment> {
        const pois: POI[] = [];
        
        // Génère 3 POIs pour chaque côté
        ['gauche', 'droite'].forEach(side => {
            for (let i = 0; i < 3; i++) {
                const config: POIGeneratorConfig = {
                    baseLat,
                    baseLng,
                    altitude,
                    percent,
                    side: side as POISide
                };
                
                this.generatePOI(config).subscribe(poi => {
                    if (poi) pois.push(poi);
                });
            }
        });

        return of({ percent, pois });
    }

    /**
     * Génère un POI unique avec des données réelles
     */
    private generatePOI(config: POIGeneratorConfig): Observable<POI> {
        const type = this.getRandomPOIType();
        const offset = config.side === 'gauche' ? -0.05 : 0.05;
        
        // Recherche un POI réel via l'API Wikipedia
        return this.searchWikipediaPOI(
            config.baseLat + offset,
            config.baseLng + offset,
            type
        ).pipe(
            map(wikiData => ({
                id: `poi-${config.percent}-${config.side}-${Date.now()}`,
                name: wikiData.title,
                type,
                coordinates: {
                    lat: config.baseLat + offset,
                    lng: config.baseLng + offset
                },
                photo: wikiData.thumbnail?.source || this.getDefaultPhoto(type),
                description: this.generateDescription(wikiData.extract, type, config.side),
                wikiUrl: wikiData.content_urls?.desktop?.page || '',
                zoom: this.calculateZoom(config.altitude),
                side: config.side,
                altitude: config.altitude,
                percent: config.percent
            })),
            catchError(() => of(this.generateFallbackPOI(config, type)))
        );
    }

    /**
     * Recherche un POI sur Wikipedia
     */
    private searchWikipediaPOI(lat: number, lng: number, type: POIType): Observable<any> {
        const params = {
            action: 'query',
            format: 'json',
            prop: 'extracts|pageimages|info',
            inprop: 'url',
            exintro: true,
            explaintext: true,
            piprop: 'thumbnail',
            pilimit: 1,
            titles: this.getSearchQuery(type, lat, lng),
            origin: '*'
        };

        return this.http.get(this.WIKI_API_URL, { params });
    }

    /**
     * Génère un POI de secours si l'API échoue
     */
    private generateFallbackPOI(config: POIGeneratorConfig, type: POIType): POI {
        const offset = config.side === 'gauche' ? -0.05 : 0.05;
        return {
            id: `poi-fallback-${Date.now()}`,
            name: `${type} ${config.percent}%`,
            type,
            coordinates: {
                lat: config.baseLat + offset,
                lng: config.baseLng + offset
            },
            photo: this.getDefaultPhoto(type),
            description: `Un magnifique ${type} visible depuis le hublot côté ${config.side}.`,
            wikiUrl: '',
            zoom: this.calculateZoom(config.altitude),
            side: config.side,
            altitude: config.altitude,
            percent: config.percent
        };
    }

    /**
     * Calcule le niveau de zoom en fonction de l'altitude
     */
    private calculateZoom(altitude: number): number {
        if (altitude < 10000) return 13;
        if (altitude < 20000) return 11;
        if (altitude < 30000) return 9;
        return 8;
    }

    /**
     * Génère une description à partir des données Wikipedia
     */
    private generateDescription(extract: string, type: POIType, side: POISide): string {
        const lines = extract.split('\n').filter(line => line.trim().length > 0);
        return [
            `Découvrez ce magnifique ${type} visible depuis le hublot côté ${side}.`,
            lines[0] || `Un site remarquable à ne pas manquer.`,
            lines[1] || `Une vue imprenable sur ce point d'intérêt.`
        ].join('\n');
    }

    /**
     * Retourne une photo par défaut selon le type
     */
    private getDefaultPhoto(type: POIType): string {
        return `assets/images/pois/${type.toLowerCase()}.jpg`;
    }

    /**
     * Retourne un type de POI aléatoire
     */
    private getRandomPOIType(): POIType {
        return this.POI_TYPES[Math.floor(Math.random() * this.POI_TYPES.length)];
    }

    /**
     * Génère une requête de recherche pour Wikipedia
     */
    private getSearchQuery(type: POIType, lat: number, lng: number): string {
        return `${type} ${lat.toFixed(2)} ${lng.toFixed(2)}`;
    }
} 