import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { POI } from '../../services/flight/models/poi.interface';
import * as L from 'leaflet';
import { FlightSegment } from '../../services/flight/models/flight.interface';

@Component({
    selector: 'app-poi-table',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './poi-table.component.html',
    styleUrls: ['./poi-table.component.scss']
})
export class POITableComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
    @Input() segments: any[] = [];
    @Input() currentPercent: number = 0;

    enrichedSegments: any[] = [];
    displayedColumns: string[] = [
        'percent',
        'altitude',
        'poisLeft',
        'poisRight'
    ];

    private map: L.Map | null = null;
    private planeMarker: L.Marker | null = null;
    private planeIcon: L.Icon;
    private userZoom: number | null = null;
    private autoZoom: boolean = true;
    private animationInterval: any = null;
    private animationPercent: number = 0;
    private lastUpdateTime: number = 0;

    constructor() {
        this.planeIcon = L.icon({
            iconUrl: 'assets/plane_000deg.png',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
    }

    ngAfterViewInit() {
        this.initMap();
    }

    private getPlaneIconForHeading(heading: number): L.Icon {
        // Arrondir à la quinzaine la plus proche
        const rounded = Math.round(heading / 15) * 15;
        const normalized = (rounded % 360 + 360) % 360;
        const filename = `assets/plane_${normalized.toString().padStart(3, '0')}deg.png`;
        return L.icon({
            iconUrl: filename,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
    }

    private initMap() {
        if (!this.map) {
            this.map = L.map('flightMap').setView([0, 0], 2);
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles © Esri'
            }).addTo(this.map);
            this.planeMarker = L.marker([0, 0], { icon: this.planeIcon }).addTo(this.map);
            this.map.on('zoomend', () => {
                this.userZoom = this.map!.getZoom();
                this.autoZoom = false;
            });
        }
    }

    private updatePlanePosition() {
        if (!this.map || !this.planeMarker || this.enrichedSegments.length === 0) return;
        const currentSegment = this.enrichedSegments.find(segment => segment.percent === Math.floor(this.currentPercent));
        if (currentSegment) {
            const { lat, lng, altitude, heading } = currentSegment;
            // Mettre à jour l'icône selon le heading
            const icon = this.getPlaneIconForHeading(heading ?? 0);
            this.planeMarker.setIcon(icon);
            this.planeMarker.setLatLng([lat, lng]);
            // Calculer le zoom en fonction de l'altitude, sauf si l'utilisateur a choisi un zoom
            let zoom = this.userZoom ?? this.calculateZoomFromAltitude(altitude);
            if (this.autoZoom) zoom = this.calculateZoomFromAltitude(altitude);
            this.map.setView([lat, lng], zoom);
        }
    }

    private calculateZoomFromAltitude(altitude: number): number {
        // Logique de zoom basée sur l'altitude
        if (altitude > 30000) return 4;      // Très haute altitude
        if (altitude > 20000) return 5;      // Haute altitude
        if (altitude > 10000) return 6;      // Moyenne altitude
        if (altitude > 5000) return 7;       // Basse altitude
        return 8;                            // Très basse altitude
    }

    ngOnInit() {
        this.generateAndEnrichSegments();
        this.animationPercent = this.currentPercent;
        setTimeout(() => {
            this.initMap();
            this.updatePlanePosition();
            this.startAnimation();
        }, 100);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['segments'] || changes['currentPercent']) {
            this.generateAndEnrichSegments();
            if (this.map) {
                this.updatePlanePosition();
            }
            // Si l'utilisateur déplace le slider, on saute à la position demandée
            this.animationPercent = this.currentPercent;
            this.lastUpdateTime = Date.now();
        }
    }

    ngOnDestroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.stopAnimation();
    }

    private calculateHeading(lat1: number, lng1: number, lat2: number, lng2: number): number {
        // Formule de cap initial (bearing) en degrés
        const toRad = (deg: number) => deg * Math.PI / 180;
        const toDeg = (rad: number) => rad * 180 / Math.PI;
        const dLon = toRad(lng2 - lng1);
        const y = Math.sin(dLon) * Math.cos(toRad(lat2));
        const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
        let brng = Math.atan2(y, x);
        brng = toDeg(brng);
        return (brng + 360) % 360;
    }

    private generateAndEnrichSegments() {
        this.enrichedSegments = this.segments.map((seg, idx, arr) => {
            // Calcul du heading vers le prochain segment (ou le précédent si dernier)
            let heading = 0;
            if (arr.length > 1) {
                if (idx < arr.length - 1) {
                    heading = this.calculateHeading(seg.lat, seg.lng, arr[idx + 1].lat, arr[idx + 1].lng);
                } else {
                    heading = this.calculateHeading(arr[idx - 1].lat, arr[idx - 1].lng, seg.lat, seg.lng);
                }
            }
            // Pour chaque segment, génère 3 POIs mockés à gauche et 3 à droite
            const pois: POI[] = [];
            ['gauche', 'droite'].forEach(side => {
                for (let i = 0; i < 3; i++) {
                    pois.push({
                        id: `mock-poi-${seg.percent}-${side}-${i}`,
                        name: `POI ${seg.percent}% ${side} #${i+1}`,
                        type: ['Montagne', 'Lac', 'Village', 'Forêt', 'Monument', 'Point de vue'][i % 6] as any,
                        coordinates: {
                            lat: seg.lat + (side === 'gauche' ? -0.05 : 0.05),
                            lng: seg.lng + (side === 'gauche' ? -0.05 : 0.05)
                        },
                        photo: `https://placehold.co/64x64?text=${side}+${i+1}`,
                        description: `Découvrez POI ${seg.percent}% ${side} #${i+1}, un magnifique ${['Montagne', 'Lac', 'Village', 'Forêt', 'Monument', 'Point de vue'][i % 6]} visible depuis le hublot côté ${side}.\nUn site incontournable pour les voyageurs.\nVue simulée.`,
                        wikiUrl: `https://fr.wikipedia.org/wiki/POI_${seg.percent}_${side}_${i+1}`,
                        zoom: seg.altitude < 10000 ? 13 : seg.altitude < 20000 ? 11 : seg.altitude < 30000 ? 9 : 8,
                        side: side as 'gauche' | 'droite',
                        altitude: seg.altitude,
                        percent: seg.percent
                    });
                }
            });
            return {
                ...seg,
                pois,
                heading
            };
        });
    }

    getPOIsForSide(pois: POI[], side: 'gauche' | 'droite'): POI[] {
        return pois.filter(poi => poi.side === side);
    }

    isActiveSegment(percent: number): boolean {
        return percent === Math.floor(this.currentPercent);
    }

    // Ajouter une méthode pour réactiver le zoom auto si besoin
    public resetAutoZoom() {
        this.autoZoom = true;
        this.userZoom = null;
        this.updatePlanePosition();
    }

    private startAnimation() {
        this.stopAnimation();
        this.lastUpdateTime = Date.now();
        this.animationInterval = setInterval(() => {
            this.animatePlane();
        }, 100); // 10 FPS
    }

    private stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    private animatePlane() {
        if (!this.enrichedSegments || this.enrichedSegments.length < 2) return;
        const now = Date.now();
        const dt = (now - this.lastUpdateTime) / 1000; // en secondes
        this.lastUpdateTime = now;

        // Trouver les deux segments encadrant animationPercent
        const lowerIdx = Math.floor(this.animationPercent);
        const upperIdx = Math.min(lowerIdx + 1, this.enrichedSegments.length - 1);
        const segA = this.enrichedSegments[lowerIdx];
        const segB = this.enrichedSegments[upperIdx];
        if (!segA || !segB) return;

        // Vitesse moyenne entre les deux segments (en %/s)
        const percentDelta = segB.percent - segA.percent;
        const elapsedDelta = segB.elapsedMin - segA.elapsedMin;
        const speedPercentPerMin = percentDelta / (elapsedDelta || 1);
        const speedPercentPerSec = speedPercentPerMin / 60;

        // Avancer la progression
        this.animationPercent += speedPercentPerSec * dt;
        if (this.animationPercent > 100) this.animationPercent = 100;

        // Interpolation linéaire
        const t = this.animationPercent - segA.percent;
        const interp = (a: number, b: number) => a + (b - a) * t;
        const lat = interp(segA.lat, segB.lat);
        const lng = interp(segA.lng, segB.lng);
        const altitude = interp(segA.altitude, segB.altitude);
        const heading = interp(segA.heading, segB.heading);

        // Mettre à jour la position du marqueur
        if (this.map && this.planeMarker) {
            const icon = this.getPlaneIconForHeading(heading);
            this.planeMarker.setIcon(icon);
            this.planeMarker.setLatLng([lat, lng]);
            let zoom = this.userZoom ?? this.calculateZoomFromAltitude(altitude);
            if (this.autoZoom) zoom = this.calculateZoomFromAltitude(altitude);
            this.map.setView([lat, lng], zoom);
        }
    }
} 