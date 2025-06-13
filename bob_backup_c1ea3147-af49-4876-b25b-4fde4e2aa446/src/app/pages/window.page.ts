import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DateTime, Duration } from 'luxon';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { IonPopover } from '@ionic/angular';
import * as L from 'leaflet';
import { WindowMapTestComponent } from './window-map-test.component';
// TODO: Adapter UserStatusBarComponent import
// TODO: Adapter TranslatePipe import
// TODO: Adapter AuthService import

@Component({
  selector: 'app-window',
  standalone: true,
  template: `
    <ion-content>
      <app-window-map-test [lat]="flightData?.lat_t_deg" [lon]="flightData?.lon_t_deg"></app-window-map-test>
      <div class="placeholder-container" *ngIf="flightData">
        <h1>✈️ Vol démo Genève → Athènes <ion-badge color="warning">DEMO</ion-badge></h1>
        <div class="flight-info-block">
          <div><b>Départ :</b> {{ flightData.departureCity }} ({{ flightData.departureAirport }})</div>
          <div><b>Heure de départ :</b> {{ flightData.departureTimeGeneva }} (GVA) / {{ flightData.departureTimeAthens }} (ATH)</div>
          <div><b>Arrivée :</b> {{ flightData.arrivalCity }} ({{ flightData.arrivalAirport }})</div>
          <div><b>Heure d'arrivée :</b> {{ flightData.arrivalTimeAthens }} (ATH) / {{ flightData.arrivalTimeGeneva }} (GVA)</div>
          <div><b>Numéro de vol :</b> {{ flightData.flightNumber }} | <b>Compagnie :</b> {{ flightData.airline }}</div>
          <div><b>Avion :</b> {{ flightData.aircraft }}</div>
        </div>
        <div class="progress-block">
          <h2>🕒 Statut du vol</h2>
          <div><b>Heure actuelle à Genève :</b> {{ flightData.nowGeneva }} (GVA) / {{ flightData.nowAthens }} (ATH)</div>
          <div><b>Heure actuelle à Athènes :</b> {{ flightData.nowAthens }} (ATH) / {{ flightData.nowGeneva }} (GVA)</div>
          <div><b>Progression du vol :</b> {{ flightData.progressPercent }} %</div>
          <div><b>Temps écoulé en vol :</b> {{ flightData.elapsed }}</div>
          <div><b>Temps restant :</b> {{ flightData.remaining }}</div>
          <div><b>Durée totale du vol :</b> {{ flightData.duration }}</div>
          <div><b>Statut :</b> {{ flightData.status }}</div>
          <div><b>Phase de vol :</b> {{ flightData.phase }}</div>
          <div><b>Vitesse sol :</b> {{ flightData.v_sol_kt }} kt ({{ flightData.v_sol_kmh }} km/h)</div>
          <div><b>Distance parcourue :</b> {{ flightData.d_elapsed_km }} km</div>
          <div><b>Distance restante :</b> {{ flightData.d_remaining_km }} km</div>
          <div><b>Fraction du trajet :</b> {{ flightData.fraction_f }} %</div>
          <div><b>Coordonnées actuelles :</b> {{ flightData.lat_t_deg }} N, {{ flightData.lon_t_deg }} E</div>
          <div class="poi-section"><b>Points d'intérêt à gauche :</b>
            <ul>
              <li *ngFor="let poi of currentPOI.left">
                <a href="#" (click)="openPOIPopover(poi, $event); $event.preventDefault()">
                  <b>{{ poi.name }}</b>
                </a>
                <div class="poi-desc">{{ poi.description }}</div>
              </li>
            </ul>
          </div>
          <div class="poi-section"><b>Points d'intérêt à droite :</b>
            <ul>
              <li *ngFor="let poi of currentPOI.right">
                <a href="#" (click)="openPOIPopover(poi, $event); $event.preventDefault()">
                  <b>{{ poi.name }}</b>
                </a>
                <div class="poi-desc">{{ poi.description }}</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div *ngIf="!flightData">
        <ion-icon name="map-outline" class="placeholder-icon"></ion-icon>
        <h1>Ma Fenêtre</h1>
        <p>Aucun vol démo en cours.</p>
      </div>
      <div *ngIf="showPOIModal && selectedPOI" class="poi-popup-overlay" (click)="closePOIPopover()">
        <div class="poi-popup-waw" (click)="$event.stopPropagation()">
          <div class="poi-popup-header">
            <strong>{{ selectedPOI.name }}</strong>
            <button class="poi-popup-close" (click)="closePOIPopover()">✕</button>
          </div>
          <div class="poi-popup-body">
            <img *ngIf="selectedPOI.image_url" [src]="selectedPOI.image_url" [alt]="selectedPOI.name" />
            <p class="poi-popup-desc">{{ selectedPOI.description }}</p>
            <p class="poi-popup-coords">📍 <em>Lat</em> {{ currentWaypoint?.lat | number:'1.4-4' }} N, <em>Lon</em> {{ currentWaypoint?.lon | number:'1.4-4' }} E</p>
          </div>
          <div class="poi-popup-footer">
            <a *ngIf="selectedPOI.wiki_url" href="{{ selectedPOI.wiki_url }}" target="_blank">Voir sur Wikipédia ↗</a>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `ion-content {
      --background: #fff;
      height: 100%;
      min-height: 100vh;
      padding: 0 !important;
      margin: 0 !important;
      overflow: hidden !important;
    }
    app-window-map-test, #map, .leaflet-container {
      height: 80vh !important;
      width: 100vw !important;
      min-height: 400px !important;
      background: #fff !important;
      margin: 0;
      display: block;
    }
    .placeholder-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; text-align: center; } 
    .placeholder-icon { font-size: 64px; color: #00BCD4; margin-bottom: 24px; } 
    h1 { color: #00BCD4; font-size: 2rem; margin-bottom: 8px; } 
    p { color: #FF9800; font-size: 1.1rem; font-style: italic; } 
    .flight-info-block, .progress-block { margin: 18px 0; background: #f8f9fa; border-radius: 12px; padding: 18px 24px; box-shadow: 0 2px 8px #0001; text-align: left; min-width: 320px; } 
    .flight-info-block b, .progress-block b { color: #1976d2; } 
    .progress-block { background: #fffbe7; }
    .poi-section { background: #f0f4ff; border-radius: 12px; padding: 16px 18px; margin-top: 18px; box-shadow: 0 2px 12px #0002; }
    .poi-section ul { padding-left: 18px; }
    .poi-section li { margin-bottom: 10px; }
    .poi-section a { color: #1976d2; font-weight: 600; text-decoration: underline; transition: color 0.2s; }
    .poi-section a:hover { color: #ff9800; }
    .poi-desc { font-style: italic; color: #444; margin-left: 2px; font-size: 0.98em; }
    .poi-badge { display: inline-block; background: #1976d2; color: #fff; border-radius: 8px; padding: 2px 10px; font-size: 0.85em; margin-left: 8px; }
    .poi-popup-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.18); z-index: 9999; display: flex; align-items: center; justify-content: center; }
    .poi-popup-waw { border:1px solid #ccc; border-radius:8px; width:300px; max-width:95vw; box-shadow:0 2px 16px rgba(0,0,0,0.18); font-family:sans-serif; background:#fff; animation: popin 0.22s cubic-bezier(.4,1.4,.6,1) both; }
    .poi-popup-header { background:#f5f5f5; padding:8px 12px; border-top-left-radius:8px; border-top-right-radius:8px; display:flex; justify-content:space-between; align-items:center; }
    .poi-popup-header strong { font-size:1.1em; color:#1976d2; }
    .poi-popup-close { background:none; border:none; font-size:18px; cursor:pointer; color:#888; transition:color 0.2s; }
    .poi-popup-close:hover { color:#d32f2f; }
    .poi-popup-body { padding:12px; }
    .poi-popup-body img { width:100%; height:auto; border-radius:4px; margin-bottom:8px; box-shadow:0 1px 4px #0001; }
    .poi-popup-desc { margin:0 0 8px; font-size:14px; line-height:1.4; color:#222; }
    .poi-popup-coords { margin:0; font-size:12px; color:#555; }
    .poi-popup-footer { background:#fafafa; padding:8px 12px; border-bottom-left-radius:8px; border-bottom-right-radius:8px; text-align:right; }
    .poi-popup-footer a { text-decoration:none; font-size:13px; color:#1976d2; font-weight:600; }
    .poi-popup-footer a:hover { color:#ff9800; }
    @keyframes popin { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .flight-path {
      stroke-dasharray: 5, 10;
      animation: dash 30s linear infinite;
    }
    @keyframes dash {
      to {
        stroke-dashoffset: -1000;
      }
    }
    .plane-icon-div {
      position: relative;
    }
    .plane-shadow {
      position: absolute;
      width: 20px;
      height: 4px;
      background: rgba(0,0,0,0.2);
      border-radius: 50%;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      filter: blur(2px);
    }
    .poi-marker {
      position: relative;
    }
    .poi-pulse {
      position: absolute;
      width: 28px;
      height: 28px;
      background: rgba(25, 118, 210, 0.3);
      border-radius: 50%;
      animation: pulse 2s ease-out infinite;
    }
    @keyframes pulse {
      0% {
        transform: scale(0.5);
        opacity: 1;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
    .custom-popup .leaflet-popup-content-wrapper {
      background: rgba(255,255,255,0.95);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .poi-popup h3 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-size: 1.1em;
    }
    .poi-popup p {
      margin: 0 0 8px 0;
      font-size: 0.9em;
      color: #333;
    }
    .poi-popup a {
      color: #1976d2;
      text-decoration: none;
      font-size: 0.9em;
      font-weight: 500;
    }
    .poi-popup a:hover {
      text-decoration: underline;
    }
    `
  ],
  imports: [CommonModule, IonicModule, WindowMapTestComponent /*, UserStatusBarComponent, TranslatePipe*/]
})
export class WindowPage {
  flightData: any = null;
  intervalId: any;
  loading = true;
  user: User | null = null;
  departure: any = null;
  arrival: any = null;
  waypoints: any[] = [
    {
      pct: 0,
      lat: 46.2381,
      lon: 6.1080,
      poi_left: [
        {
          name: "Crêt de la Neige",
          description: "Le Crêt de la Neige, culminant à 1 720 m, est le point le plus haut du massif du Jura, situé sur la frontière Ain/Jura : il offre une vue à 360° sur le lac Léman, la Dôle et par temps clair jusqu'aux Vosges et à la Forêt-Noire.",
          wiki_url: "https://fr.wikipedia.org/wiki/Cr%C3%AAt_de_la_Neige",
          type: "Montagne",
          country: "France",
          altitude: 1720,
          image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Cr%C3%AAt_de_la_Neige_depuis_la_D%C3%B4le.jpg"
        },
        {
          name: "Lac Léman",
          description: "Le Léman, ou lac de Genève, est un lac d'origine glaciaire franco-suisse de 581,3 km², le plus vaste lac alpin ; il est principalement alimenté par le Rhône.",
          wiki_url: "https://fr.wikipedia.org/wiki/L%C3%A9man",
          type: "Lac",
          country: "France/Suisse",
          image_url: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Lac_L%C3%A9man_depuis_Montreux.jpg"
        },
        {
          name: "Mont Salève",
          description: "Le Salève, ou Mont Salève (1 379 m), est un crêt calcaire du Jura en Haute-Savoie, surnommé « balcon de Genève », très prisé pour ses vues sur Genève et le Léman.",
          wiki_url: "https://fr.wikipedia.org/wiki/Le_Sal%C3%A8ve",
          type: "Montagne",
          country: "France",
          altitude: 1379,
          image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Le_Sal%C3%A8ve_depuis_Gen%C3%A8ve.jpg"
        }
      ],
      poi_right: [
        {
          name: "Mont Blanc",
          description: "Le Mont Blanc, à 4 806 m, est le plus haut sommet des Alpes et d'Europe occidentale, à cheval sur la frontière franco-italienne.",
          wiki_url: "https://fr.wikipedia.org/wiki/Mont_Blanc",
          type: "Montagne",
          country: "France/Italie",
          altitude: 4806,
          image_url: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Mont_Blanc_depuis_la_Tour_Ronde.jpg"
        },
        {
          name: "Vallée de l'Arve",
          description: "La vallée de l'Arve est une vallée glaciaire de Haute-Savoie (105 km), traversée par la rivière Arve qui rejoint le Rhône à Genève.",
          wiki_url: "https://fr.wikipedia.org/wiki/Vall%C3%A9e_de_l%27Arve",
          type: "Vallée",
          country: "France",
          image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Vall%C3%A9e_de_l%27Arve.jpg"
        },
        {
          name: "Chamonix",
          description: "Chamonix-Mont-Blanc est une commune de Haute-Savoie, pionnière de l'alpinisme et station de sports d'hiver au pied du Mont Blanc.",
          wiki_url: "https://fr.wikipedia.org/wiki/Chamonix",
          type: "Ville",
          country: "France",
          altitude: 1035,
          image_url: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Chamonix_vue_g%C3%A9n%C3%A9rale.jpg"
        }
      ]
    },
    {
      pct: 25,
      lat: 44.4339,
      lon: 11.0164,
      poi_left: [
        { name: "Dolomites (Marmolada)", description: "Massif alpin célèbre pour ses sommets escarpés.", wiki_url: "https://fr.wikipedia.org/wiki/Marmolada", type: "Montagne", country: "Italie", altitude: 3343, image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2d/Marmolada_from_Passo_Pordoi.jpg" },
        { name: "Lac de Garde (côté est)", description: "Le plus grand lac d'Italie, réputé pour ses paysages.", wiki_url: "https://fr.wikipedia.org/wiki/Lac_de_Garde", type: "Lac", country: "Italie", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Lake_Garda_from_Monte_Baldo.jpg" },
        { name: "Massif de Brenta", description: "Massif montagneux des Alpes italiennes.", wiki_url: "https://fr.wikipedia.org/wiki/Groupe_de_Brenta", type: "Montagne", country: "Italie", image_url: "https://upload.wikimedia.org/wikipedia/commons/7/7d/Brenta_group_from_Monte_Bondone.jpg" }
      ],
      poi_right: [
        { name: "Plaine du Pô", description: "Grande plaine fertile traversée par le fleuve Pô.", wiki_url: "https://fr.wikipedia.org/wiki/Plaine_du_P%C3%B4", type: "Plaine", country: "Italie", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Po_Plain.jpg" },
        { name: "Vérone (Arènes, balcon Juliet)", description: "Ville italienne célèbre pour ses arènes romaines et la légende de Roméo et Juliette.", wiki_url: "https://fr.wikipedia.org/wiki/V%C3%A9rone", type: "Ville", country: "Italie", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Verona_Arena_2013.jpg" },
        { name: "Mantoue", description: "Ville d'art et d'histoire en Lombardie.", wiki_url: "https://fr.wikipedia.org/wiki/Mantoue", type: "Ville", country: "Italie", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Mantova_skyline.jpg" }
      ]
    },
    {
      pct: 50,
      lat: 42.4326,
      lon: 15.6155,
      poi_left: [
        { name: "Côte adriatique (Ravenne, plages Émilie-Romagne)", description: "Côte italienne réputée pour ses plages et la ville de Ravenne.", wiki_url: "https://fr.wikipedia.org/wiki/Ravenne", type: "Côte", country: "Italie", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Ravenna_Beach.jpg" },
        { name: "Venise (lagune, place Saint-Marc)", description: "Ville unique bâtie sur l'eau, célèbre pour sa lagune et la place Saint-Marc.", wiki_url: "https://fr.wikipedia.org/wiki/Venise", type: "Ville", country: "Italie", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Venice_San_Marco.jpg" },
        { name: "Delta du Pô", description: "Zone humide protégée à l'embouchure du Pô.", wiki_url: "https://fr.wikipedia.org/wiki/Delta_du_P%C3%B4", type: "Delta", country: "Italie", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Po_Delta.jpg" }
      ],
      poi_right: [
        { name: "Côte dalmate (îles de Cres, Krk)", description: "Côte croate parsemée d'îles pittoresques.", wiki_url: "https://fr.wikipedia.org/wiki/C%C3%B4te_dalmate", type: "Côte", country: "Croatie", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Dalmatian_Coast.jpg" },
        { name: "Dubrovnik (vieille ville)", description: "Ville fortifiée croate classée à l'UNESCO.", wiki_url: "https://fr.wikipedia.org/wiki/Dubrovnik", type: "Ville", country: "Croatie", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Dubrovnik_Old_Town.jpg" },
        { name: "Archipel des Kornati", description: "Parc national composé de nombreuses îles.", wiki_url: "https://fr.wikipedia.org/wiki/Parc_national_des_Kornati", type: "Archipel", country: "Croatie", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Kornati_National_Park.jpg" }
      ]
    },
    {
      pct: 75,
      lat: 40.2591,
      lon: 19.9183,
      poi_left: [
        { name: "Massif de Llogara (Albanie)", description: "Massif montagneux du sud de l'Albanie.", wiki_url: "https://fr.wikipedia.org/wiki/Parc_national_de_Llogara", type: "Montagne", country: "Albanie", altitude: 2018, image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Llogara_Pass.jpg" },
        { name: "Vallée de la rivière Vjosa", description: "Rivière sauvage d'Albanie.", wiki_url: "https://fr.wikipedia.org/wiki/Vjosa", type: "Rivière", country: "Albanie", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Vjosa_River.jpg" },
        { name: "Parc national de Butrint", description: "Site archéologique et parc naturel.", wiki_url: "https://fr.wikipedia.org/wiki/Butrint", type: "Parc", country: "Albanie", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Butrint_National_Park.jpg" }
      ],
      poi_right: [
        { name: "Îles Ioniennes (Corfou, Paxi)", description: "Archipel grec au large de l'Albanie.", wiki_url: "https://fr.wikipedia.org/wiki/%C3%8Eles_Ioniennes", type: "Archipel", country: "Grèce", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Ionian_Islands.jpg" },
        { name: "Golfe de Patras", description: "Golfe de la mer Ionienne en Grèce.", wiki_url: "https://fr.wikipedia.org/wiki/Golfe_de_Patras", type: "Golfe", country: "Grèce", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Patras_Gulf.jpg" },
        { name: "Côtes de l'Épire", description: "Région côtière montagneuse de Grèce.", wiki_url: "https://fr.wikipedia.org/wiki/%C3%89pire_(p%C3%A9riphr%C3%A9rie)", type: "Côte", country: "Grèce", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Epirus_Coast.jpg" }
      ]
    },
    {
      pct: 100,
      lat: 37.9364,
      lon: 23.9445,
      poi_left: [
        { name: "Golfe Saronique (Salamine, Égine)", description: "Golfe maritime au sud d'Athènes.", wiki_url: "https://fr.wikipedia.org/wiki/Golfe_Saronique", type: "Golfe", country: "Grèce", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Saronic_Gulf.jpg" },
        { name: "Mont Hymette", description: "Montagne au sud-est d'Athènes.", wiki_url: "https://fr.wikipedia.org/wiki/Hymette", type: "Montagne", country: "Grèce", altitude: 1026, image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Hymettus_Mountain.jpg" },
        { name: "Port du Pirée", description: "Principal port d'Athènes.", wiki_url: "https://fr.wikipedia.org/wiki/Le_Pir%C3%A9e", type: "Port", country: "Grèce", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Piraeus_Port.jpg" }
      ],
      poi_right: [
        { name: "Acropole et Parthénon", description: "Site antique emblématique d'Athènes.", wiki_url: "https://fr.wikipedia.org/wiki/Acropole_d%27Ath%C3%A8nes", type: "Site antique", country: "Grèce", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Acropolis_Parthenon.jpg" },
        { name: "Quartier de Plaka", description: "Quartier historique d'Athènes.", wiki_url: "https://fr.wikipedia.org/wiki/Pláka", type: "Quartier", country: "Grèce", image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Plaka_Athens.jpg" },
        { name: "Mont Lycabette", description: "Colline dominant Athènes.", wiki_url: "https://fr.wikipedia.org/wiki/Mont_Lycabette", type: "Colline", country: "Grèce", altitude: 277, image_url: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Lycabettus_Hill.jpg" }
      ]
    }
  ];

  currentPOI: { left: any[]; right: any[] } = { left: [], right: [] };
  public selectedPOI: any = null;
  public showPOIModal: boolean = false;
  public popoverEvent: MouseEvent | null = null;
  public currentWaypoint: any = null;

  constructor(private firestore: Firestore, private auth: Auth) {}

  ngOnInit() {
    this.initDemoFlight();
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.updateDemoFlight(), 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  initDemoFlight() {
    // Paramètres du vol
    const durationMin = 165; // 2h45
    const now = DateTime.now();
    const percent = 0.25;
    const elapsedMs = Math.round(durationMin * 60 * 1000 * percent);
    this.departure = now.minus({ milliseconds: elapsedMs });
    this.arrival = this.departure.plus({ minutes: durationMin });
    this.updateDemoFlight();
  }

  updateDemoFlight() {
    if (!this.departure || !this.arrival) return;
    const now = DateTime.now();
    // Infos aéroports
    const gva = { code: 'GVA', city: 'Genève', name: 'Aéroport de Genève', tz: 'Europe/Zurich', lat: 46.2381, lon: 6.1080 };
    const ath = { code: 'ATH', city: 'Athènes', name: "Aéroport d'Athènes Elefthérios-Venizélos", tz: 'Europe/Athens', lat: 37.9364, lon: 23.9445 };
    // Profil de vol
    const t_total_min = 148;
    const t_climb = 20;
    const t_descent = 30;
    const KT_TO_KMH = 1.852;
    const v_climb_kt = 280;
    const v_descent_kt = 300;
    const v_climb_kmh = v_climb_kt * KT_TO_KMH;
    const v_descent_kmh = v_descent_kt * KT_TO_KMH;
    const t_cruise = t_total_min - t_climb - t_descent;
    // Haversine (grand-cercle)
    const R = 6371;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const toDeg = (rad: number) => rad * 180 / Math.PI;
    const φ1 = toRad(gva.lat);
    const φ2 = toRad(ath.lat);
    const λ1 = toRad(gva.lon);
    const λ2 = toRad(ath.lon);
    const Δφ = toRad(ath.lat - gva.lat);
    const Δλ = toRad(ath.lon - gva.lon);
    const hav = (Δ: number) => Math.sin(Δ / 2) ** 2;
    const a = hav(Δφ) + Math.cos(φ1) * Math.cos(φ2) * hav(Δλ);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const D_gc_km = R * c;
    // Calibration croisière
    const d_climb = v_climb_kmh * (t_climb / 60);
    const d_descent = v_descent_kmh * (t_descent / 60);
    const t_cruise_h = t_cruise / 60;
    const v_cruise_kmh = (D_gc_km - d_climb - d_descent) / t_cruise_h;
    const v_cruise_kt = v_cruise_kmh / KT_TO_KMH;
    const d_cruise = v_cruise_kmh * t_cruise_h;
    // Temps écoulé
    const total = this.arrival.diff(this.departure);
    const elapsed = now.diff(this.departure);
    const t_elapsed_min = elapsed.as('minutes');
    let phase = '';
    let v_sol_kt = 0;
    let v_sol_kmh = 0;
    let d_elapsed_km = 0;
    if (t_elapsed_min <= t_climb) {
      phase = 'Montée';
      v_sol_kt = v_climb_kt;
      v_sol_kmh = v_climb_kmh;
      d_elapsed_km = v_climb_kmh * (t_elapsed_min / 60);
    } else if (t_elapsed_min <= t_climb + t_cruise) {
      phase = 'Croisière';
      v_sol_kt = v_cruise_kt;
      v_sol_kmh = v_cruise_kmh;
      const dt_cruise = t_elapsed_min - t_climb;
      d_elapsed_km = d_climb + v_cruise_kmh * (dt_cruise / 60);
    } else {
      phase = 'Descente';
      v_sol_kt = v_descent_kt;
      v_sol_kmh = v_descent_kmh;
      const dt_desc = t_elapsed_min - t_climb - t_cruise;
      d_elapsed_km = d_climb + d_cruise + v_descent_kmh * (dt_desc / 60);
    }
    const fraction_f = Math.max(0, Math.min(1, d_elapsed_km / D_gc_km));
    // Interpolation du point courant (grand-cercle)
    const δ = c;
    const A = Math.sin((1 - fraction_f) * δ) / Math.sin(δ);
    const B = Math.sin(fraction_f * δ) / Math.sin(δ);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    const φ_t = Math.atan2(z, Math.sqrt(x * x + y * y));
    const λ_t = Math.atan2(y, x);
    const lat_t_deg = toDeg(φ_t);
    const lon_t_deg = toDeg(λ_t);
    // Calculs horaires
    const depTimeGeneva = this.departure.setZone(gva.tz);
    const depTimeAthens = this.departure.setZone(ath.tz);
    const arrTimeGeneva = this.arrival.setZone(gva.tz);
    const arrTimeAthens = this.arrival.setZone(ath.tz);
    const nowGeneva = now.setZone(gva.tz);
    const nowAthens = now.setZone(ath.tz);
    // Statut
    const progress = Math.max(0, Math.min(1, elapsed.as('milliseconds') / total.as('milliseconds')));
    const status = progress < 0 ? 'En attente' : progress >= 1 ? 'Arrivé' : 'En vol';
    const newFlightData = {
      departureCity: gva.city,
      departureAirport: gva.code,
      departureTimeGeneva: depTimeGeneva.toFormat('HH:mm dd LLL yyyy'),
      departureTimeAthens: depTimeAthens.toFormat('HH:mm dd LLL yyyy'),
      departureTZGeneva: gva.tz,
      departureTZAthens: ath.tz,
      arrivalCity: ath.city,
      arrivalAirport: ath.code,
      arrivalTimeGeneva: arrTimeGeneva.toFormat('HH:mm dd LLL yyyy'),
      arrivalTimeAthens: arrTimeAthens.toFormat('HH:mm dd LLL yyyy'),
      arrivalTZGeneva: gva.tz,
      arrivalTZAthens: ath.tz,
      flightNumber: 'EZS1528',
      airline: 'easyJet',
      aircraft: 'Airbus A320',
      nowGeneva: nowGeneva.toFormat('HH:mm:ss dd LLL yyyy'),
      nowAthens: nowAthens.toFormat('HH:mm:ss dd LLL yyyy'),
      progressPercent: Math.round(progress * 100),
      elapsed: progress < 0 ? '0 min' : Duration.fromMillis(Math.max(0, elapsed.as('milliseconds'))).toFormat('h:mm'),
      remaining: progress >= 1 ? '0 min' : Duration.fromMillis(Math.max(0, total.as('milliseconds') - elapsed.as('milliseconds'))).toFormat('h:mm'),
      duration: Duration.fromMillis(total.as('milliseconds')).toFormat('h:mm'),
      status,
      phase,
      v_sol_kt: Math.round(v_sol_kt),
      v_sol_kmh: Math.round(v_sol_kmh),
      d_elapsed_km: Math.round(d_elapsed_km),
      d_remaining_km: Math.round(D_gc_km - d_elapsed_km),
      D_gc_km: Math.round(D_gc_km),
      fraction_f: Math.round(fraction_f * 100),
      lat_t_deg: lat_t_deg.toFixed(4),
      lon_t_deg: lon_t_deg.toFixed(4)
    };
    console.log('[WindowPage] updateDemoFlight progressPercent:', newFlightData.progressPercent, 'à', new Date().toISOString());
    this.flightData = { ...newFlightData };
    // Trouver le waypoint le plus proche de la progression actuelle
    const pct = this.flightData.progressPercent;
    let closest = this.waypoints[0];
    let minDiff = 100;
    for (const wp of this.waypoints) {
      const diff = Math.abs(wp.pct - pct);
      if (diff < minDiff) {
        minDiff = diff;
        closest = wp;
      }
    }
    this.currentPOI = { left: closest.poi_left, right: closest.poi_right };
    this.currentWaypoint = closest;
    this.loading = false;
  }

  async logout() {
    // TODO: Adapter AuthService logout
    // await this.authService.logout();
    window.location.href = '/auth/email';
  }

  public openPOIPopover(poi: any, event: MouseEvent) {
    this.selectedPOI = poi;
    this.popoverEvent = event;
    this.showPOIModal = true;
  }

  public closePOIPopover() {
    this.showPOIModal = false;
    this.selectedPOI = null;
    this.popoverEvent = null;
  }
} 