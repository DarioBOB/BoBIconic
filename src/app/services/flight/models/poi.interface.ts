export type POIType = 'Montagne' | 'Lac' | 'Village' | 'Forêt' | 'Monument' | 'Point de vue' | 'Ville' | 'Site historique';
export type POISide = 'gauche' | 'droite';

export interface POI {
    id: string;
    name: string;
    type: POIType;
    coordinates: {
        lat: number;
        lng: number;
    };
    photo: string;
    description: string;
    wikiUrl: string;
    zoom: number;
    side: POISide;
    altitude: number;
    percent: number;
}

export interface POISegment {
    percent: number;
    pois: POI[];
}

export interface POIGeneratorConfig {
    baseLat: number;
    baseLng: number;
    altitude: number;
    percent: number;
    side: POISide;
} 