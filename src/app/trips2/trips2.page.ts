// src/app/trips2/trips2.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { TimezoneConverterServiceGeminiGenerated } from './services/timezone-converter-service-gemini-generated';
import { PlanGenerated, TripGenerated } from './models/trip-gemini-generated.model';

@Component({
  selector: 'app-trips2',
  templateUrl: './trips2.page.html',
  styleUrls: ['./trips2.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class Trips2PageGenerated implements OnInit {

  pastTripsGenerated: TripGenerated[] = [];
  ongoingTripsGenerated: TripGenerated[] = [];
  upcomingTripsGenerated: TripGenerated[] = [];

  selectedSegmentGenerated: 'ongoing' | 'upcoming' | 'past' = 'ongoing';

  // Propriétés pour le modal d'image
  showImageModal = false;
  selectedTripForImage: any = null;
  activeTab: 'upload' | 'url' | 'preset' = 'upload';
  selectedFile: File | null = null;
  customImageUrl = '';
  predefinedImages = [
    'https://placehold.co/400x200/FF5733/FFFFFF?text=Marrakech',
    'https://placehold.co/400x200/33FF57/FFFFFF?text=Athens',
    'https://placehold.co/400x200/5733FF/FFFFFF?text=Montreal',
    'https://placehold.co/400x200/FF33F5/FFFFFF?text=Paris',
    'https://placehold.co/400x200/33FFF5/FFFFFF?text=Tokyo',
    'https://placehold.co/400x200/F5FF33/FFFFFF?text=New+York'
  ];

  constructor(private timezoneConverterServiceGeminiGenerated: TimezoneConverterServiceGeminiGenerated) { }

  ngOnInit() {
    this.loadAndProcessDemoTripsGeminiGenerated();
  }

  /**
   * Fonction utilitaire pour parser les dates depuis les chaînes de caractères
   * avec le format "DD/MM/YYYY – HHhMM (UTC+/-X)" ou "DD/MM – HHhMM (UTC+/-X)".
   * Crée un objet Date dont la valeur interne UTC est ajustée par l'offset fourni.
   * @param dateString La chaîne de date à parser.
   * @param yearOverride Année à utiliser si non spécifiée dans la chaîne (pour "DD/MM" format).
   * @returns Un objet Date représentant le temps UTC réel de l'événement.
   */
  private parseDateWithOffset(dateString: string, yearOverride?: number): Date {
    // Regex pour le format complet "DD/MM/YYYY – HHhMM (UTC+/-X)"
    const fullRegex = /(\d{1,2})\/(\d{1,2})\/(\d{4}) – (\d{1,2})h(\d{2}) \(UTC([+-]\d{1,2})\)/;
    // Regex pour le format court "DD/MM – HHhMM (UTC+/-X)"
    const shortRegex = /(\d{1,2})\/(\d{1,2}) – (\d{1,2})h(\d{2}) \(UTC([+-]\d{1,2})\)/;

    let match = dateString.match(fullRegex);
    let year: number;
    let month: number;
    let day: number;
    let hour: number;
    let minute: number;
    let offsetHours: number;

    if (match) {
      [, day, month, year, hour, minute, offsetHours] = match.map(Number);
    } else {
      match = dateString.match(shortRegex);
      if (match) {
        [, day, month, hour, minute, offsetHours] = match.map(Number);
        year = yearOverride || new Date().getFullYear(); // Utilise l'année actuelle si non fournie
      } else {
        throw new Error(`Could not parse date string: ${dateString}`);
      }
    }

    // Le mois est basé sur 0 (janvier = 0)
    month -= 1;

    // Crée un objet Date en UTC avec les composants fournis
    const utcDate = new Date(Date.UTC(year, month, day, hour, minute));

    // Ajuste l'heure UTC par le décalage UTC spécifié dans la chaîne.
    // Si la chaîne dit UTC+2, cela signifie que l'heure locale dans cette zone est 2 heures EN AVANCE sur l'UTC.
    // Donc, pour obtenir l'heure UTC réelle de l'événement, nous soustrayons le décalage.
    utcDate.setUTCHours(utcDate.getUTCHours() - offsetHours);

    return utcDate;
  }

  private loadAndProcessDemoTripsGeminiGenerated(): void {
    const now = new Date(); // Date et heure actuelles, utilisées comme référence "maintenant"

    // --- Définition des données de démonstration à partir des fichiers texte ---
    // Les dates sont formatées pour inclure l'offset UTC afin d'être correctement parsées.
    const demoTrips: TripGenerated[] = [
      // 1. Voyage Passé : Marrakech (basé sur Voyage Passé Démo Marrakech.txt)
      {
        id: 'marrakechGeminiGenerated',
        name: 'Voyage Mémorable à Marrakech',
        description: 'Exploration culturelle et détente au Maroc.',
        image: 'https://placehold.co/400x200/FF5733/FFFFFF?text=Marrakech+Past',
        startDate: new Date(), // Sera mis à jour
        endDate: new Date(),   // Sera mis à jour
        status: 'past',        // Sera mis à jour
        plans: [
          { id: 'pM1', name: 'Vol Aller Genève → Marrakech', type: 'flight', location: 'Genève / Marrakech', timezone: 'Europe/Zurich', startDate: this.parseDateWithOffset('15/04/2024 – 09h00 (UTC+2)'), endDate: this.parseDateWithOffset('15/04/2024 – 11h30 (UTC+1)') },
          { id: 'pM2', name: 'Transfert privé Aéroport → Hôtel', type: 'transport', location: 'Marrakech', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('15/04/2024 – 12h00 (UTC+1)'), endDate: new Date(this.parseDateWithOffset('15/04/2024 – 12h00 (UTC+1)').getTime() + 45 * 60 * 1000) }, // +45 min
          { id: 'pM3', name: 'Hôtel Riu Tikida Palmeraie Marrakech', type: 'hotel', location: 'Marrakech', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('15/04/2024 – 13h00 (UTC+1)'), endDate: this.parseDateWithOffset('22/04/2024 – 11h00 (UTC+1)') },
          { id: 'pM4', name: 'Visite historique de Marrakech', type: 'activity', location: 'Marrakech', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('16/04/2024 – 09h00 (UTC+1)'), endDate: this.parseDateWithOffset('16/04/2024 – 17h00 (UTC+1)') },
          { id: 'pM5', name: 'Excursion Vallée de l’Ourika', type: 'activity', location: 'Vallée de l’Ourika', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('17/04/2024 – 08h00 (UTC+1)'), endDate: this.parseDateWithOffset('17/04/2024 – 17h30 (UTC+1)') },
          { id: 'pM6', name: 'Journée détente à l’hôtel', type: 'activity', location: 'Marrakech', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('18/04/2024 – 10h00 (UTC+1)'), endDate: this.parseDateWithOffset('18/04/2024 – 18h00 (UTC+1)') },
          { id: 'pM7', name: 'Excursion Désert d’Agafay', type: 'activity', location: 'Désert d’Agafay', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('19/04/2024 – 15h00 (UTC+1)'), endDate: this.parseDateWithOffset('19/04/2024 – 22h30 (UTC+1)') },
          { id: 'pM8', name: 'Visite Jardin Majorelle & musée YSL', type: 'activity', location: 'Marrakech', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('20/04/2024 – 10h00 (UTC+1)'), endDate: this.parseDateWithOffset('20/04/2024 – 13h30 (UTC+1)') },
          { id: 'pM9', name: 'Temps libre & shopping guidé', type: 'activity', location: 'Marrakech', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('21/04/2024 – 10h30 (UTC+1)'), endDate: this.parseDateWithOffset('21/04/2024 – 15h00 (UTC+1)') },
          { id: 'pM10', name: 'Transfert retour Hôtel → Aéroport', type: 'transport', location: 'Marrakech', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('22/04/2024 – 08h00 (UTC+1)'), endDate: new Date(this.parseDateWithOffset('22/04/2024 – 08h00 (UTC+1)').getTime() + 45 * 60 * 1000) }, // +45 min
          { id: 'pM11', name: 'Vol Retour Marrakech → Genève', type: 'flight', location: 'Marrakech / Genève', timezone: 'Africa/Casablanca', startDate: this.parseDateWithOffset('22/04/2024 – 10h30 (UTC+1)'), endDate: this.parseDateWithOffset('22/04/2024 – 13h45 (UTC+2)') },
        ]
      },
      // 2. Voyage en Cours : Athènes (basé sur Voyage En cours Démo Athene.txt)
      {
        id: 'athensGeminiGenerated',
        name: 'Aventure Grecque à Athènes et Santorin',
        description: 'Découverte de l\'histoire et des îles grecques.',
        image: 'https://placehold.co/400x200/33FF57/FFFFFF?text=Athens+Ongoing',
        startDate: new Date(), // Sera mis à jour
        endDate: new Date(),   // Sera mis à jour
        status: 'ongoing',     // Sera mis à jour
        plans: [
          { id: 'pA1', name: 'Vol Aller Genève → Athènes', type: 'flight', location: 'Genève / Athènes', timezone: 'Europe/Zurich', startDate: this.parseDateWithOffset('05/07/2024 – 07h15 (UTC+2)'), endDate: this.parseDateWithOffset('05/07/2024 – 10h45 (UTC+3)') },
          { id: 'pA2', name: 'Location de voiture Athènes Aéroport', type: 'car_rental', location: 'Athènes', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('05/07/2024 – 11h30 (UTC+3)'), endDate: this.parseDateWithOffset('13/07/2024 – 08h00 (UTC+3)') },
          { id: 'pA3', name: 'Hébergement Electra Palace Athens', type: 'hotel', location: 'Athènes', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('05/07/2024 – 14h00 (UTC+3)'), endDate: this.parseDateWithOffset('07/07/2024 – 09h00 (UTC+3)') },
          { id: 'pA4', name: 'Visite de l\'Acropole + musée', type: 'activity', location: 'Athènes', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('06/07/2024 – 09h00 (UTC+3)'), endDate: this.parseDateWithOffset('06/07/2024 – 13h00 (UTC+3)') },
          { id: 'pA5', name: 'Route : Athènes → Patras', type: 'transport', location: 'Athènes / Patras', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('07/07/2024 – 09h00 (UTC+3)'), endDate: this.parseDateWithOffset('07/07/2024 – 12h00 (UTC+3)') },
          { id: 'pA6', name: 'Traversée bateau : Patras → Santorin', type: 'transport', location: 'Patras / Santorin', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('07/07/2024 – 14h30 (UTC+3)'), endDate: this.parseDateWithOffset('08/07/2024 – 06h30 (UTC+3)') },
          { id: 'pA7', name: 'Hébergement Hotel Aressana Santorin', type: 'hotel', location: 'Santorin', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('08/07/2024 – 08h00 (UTC+3)'), endDate: this.parseDateWithOffset('11/07/2024 – 11h00 (UTC+3)') },
          { id: 'pA8', name: 'Croisière au coucher du soleil + volcan', type: 'activity', location: 'Santorin', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('09/07/2024 – 15h00 (UTC+3)'), endDate: this.parseDateWithOffset('09/07/2024 – 20h00 (UTC+3)') },
          { id: 'pA9', name: 'Vol retour : Santorin → Athènes', type: 'flight', location: 'Santorin / Athènes', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('11/07/2024 – 12h30 (UTC+3)'), endDate: this.parseDateWithOffset('11/07/2024 – 13h20 (UTC+3)') },
          { id: 'pA10', name: 'Hébergement Coco-Mat Hotel Athens', type: 'hotel', location: 'Athènes', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('11/07/2024 – 14h00 (UTC+3)'), endDate: this.parseDateWithOffset('13/07/2024 – 08h00 (UTC+3)') },
          { id: 'pA11', name: 'Dîner de fin de voyage – To Thalassino', type: 'activity', location: 'Le Pirée', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('12/07/2024 – 20h00 (UTC+3)'), endDate: new Date(this.parseDateWithOffset('12/07/2024 – 20h00 (UTC+3)').getTime() + 2 * 60 * 60 * 1000) }, // 2 heures de dîner
          { id: 'pA12', name: 'Vol retour Athènes → Genève', type: 'flight', location: 'Athènes / Genève', timezone: 'Europe/Athens', startDate: this.parseDateWithOffset('13/07/2024 – 10h15 (UTC+3)'), endDate: this.parseDateWithOffset('13/07/2024 – 13h00 (UTC+2)') },
        ]
      },
      // 3. Voyage Futur : Montréal (basé sur Voyage Futur Démo Montreal.txt)
      {
        id: 'montrealGeminiGenerated',
        name: 'Road Trip Québec : Genève – Montréal',
        description: 'Aventure de 15 jours à travers le Québec.',
        image: 'https://placehold.co/400x200/5733FF/FFFFFF?text=Montreal+Future',
        startDate: new Date(), // Sera mis à jour
        endDate: new Date(),   // Sera mis à jour
        status: 'upcoming',    // Sera mis à jour
        plans: [
          { id: 'pMtl1', name: 'Vol Aller Genève → Montréal', type: 'flight', location: 'Genève / Montréal', timezone: 'Europe/Zurich', startDate: this.parseDateWithOffset('10/09/2025 – 10h40 (UTC+2)'), endDate: this.parseDateWithOffset('10/09/2025 – 13h00 (UTC-4)') },
          { id: 'pMtl2', name: 'Location de voiture – Montréal', type: 'car_rental', location: 'Montréal', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('10/09/2025 – 13h30 (UTC-4)'), endDate: this.parseDateWithOffset('25/09/2025 – 10h00 (UTC-4)') },
          { id: 'pMtl3', name: 'Hébergement – Hôtel Bonaventure Montréal', type: 'hotel', location: 'Montréal', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('10/09/2025 – 15h00 (UTC-4)'), endDate: this.parseDateWithOffset('12/09/2025 – 11h00 (UTC-4)') },
          { id: 'pMtl4', name: 'Activité – Vieux-Montréal & Mont Royal', type: 'activity', location: 'Montréal', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('11/09/2025 – 09h00 (UTC-4)'), endDate: this.parseDateWithOffset('11/09/2025 – 12h30 (UTC-4)') },
          { id: 'pMtl5', name: 'Route : Montréal → Québec City', type: 'transport', location: 'Montréal / Québec City', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('12/09/2025 – 11h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('12/09/2025 – 11h00 (UTC-4)').getTime() + 3.5 * 60 * 60 * 1000) },
          { id: 'pMtl6', name: 'Hébergement – Auberge Saint-Antoine', type: 'hotel', location: 'Québec City', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('12/09/2025 – 15h00 (UTC-4)'), endDate: this.parseDateWithOffset('15/09/2025 – 10h30 (UTC-4)') },
          { id: 'pMtl7', name: 'Activité – Chute Montmorency + Croisière', type: 'activity', location: 'Québec City', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('13/09/2025 – 09h00 (UTC-4)'), endDate: this.parseDateWithOffset('13/09/2025 – 13h00 (UTC-4)') },
          { id: 'pMtl8', name: 'Vol interne : Québec City → Gaspé', type: 'flight', location: 'Québec City / Gaspé', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('15/09/2025 – 09h30 (UTC-4)'), endDate: this.parseDateWithOffset('15/09/2025 – 10h45 (UTC-4)') },
          { id: 'pMtl9', name: 'Location – Gaspé', type: 'car_rental', location: 'Gaspé', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('15/09/2025 – 11h00 (UTC-4)'), endDate: this.parseDateWithOffset('18/09/2025 – 10h00 (UTC-4)') },
          { id: 'pMtl10', name: 'Hébergement – Hôtel Baker Gaspé', type: 'hotel', location: 'Gaspé', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('15/09/2025 – 13h30 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('15/09/2025 – 13h30 (UTC-4)').getTime() + 3 * 24 * 60 * 60 * 1000) }, // 3 nuits
          { id: 'pMtl11', name: 'Excursion – Parc Forillon + Baleines', type: 'activity', location: 'Cap-des-Rosiers, Forillon', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('16/09/2025 – 08h00 (UTC-4)'), endDate: this.parseDateWithOffset('16/09/2025 – 12h30 (UTC-4)') },
          { id: 'pMtl12', name: 'Route Gaspé → Percé', type: 'transport', location: 'Gaspé / Percé', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('18/09/2025 – 10h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('18/09/2025 – 10h00 (UTC-4)').getTime() + 1.5 * 60 * 60 * 1000) },
          { id: 'pMtl13', name: 'Hébergement – Hôtel Riôtel Percé', type: 'hotel', location: 'Percé', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('18/09/2025 – 12h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('18/09/2025 – 12h00 (UTC-4)').getTime() + 2 * 24 * 60 * 60 * 1000) }, // 2 nuits
          { id: 'pMtl14', name: 'Excursion – Rocher Percé + Île Bonaventure', type: 'activity', location: 'Percé', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('19/09/2025 – 09h00 (UTC-4)'), endDate: this.parseDateWithOffset('19/09/2025 – 14h00 (UTC-4)') },
          { id: 'pMtl15', name: 'Percé → Rimouski', type: 'transport', location: 'Percé / Rimouski', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('20/09/2025 – 08h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('20/09/2025 – 08h00 (UTC-4)').getTime() + 5.5 * 60 * 60 * 1000) },
          { id: 'pMtl16', name: 'Hébergement – Hôtel Rimouski', type: 'hotel', location: 'Rimouski', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('20/09/2025 – 15h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('20/09/2025 – 15h00 (UTC-4)').getTime() + 1 * 24 * 60 * 60 * 1000) }, // 1 nuit
          { id: 'pMtl17', name: 'Visite – Sous-marin Onondaga + Phare', type: 'activity', location: 'Pointe-au-Père', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('20/09/2025 – 17h00 (UTC-4)'), endDate: this.parseDateWithOffset('20/09/2025 – 19h00 (UTC-4)') },
          { id: 'pMtl18', name: 'Rimouski → Tadoussac', type: 'transport', location: 'Rimouski / Tadoussac', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('21/09/2025 – 11h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('21/09/2025 – 11h00 (UTC-4)').getTime() + 2 * 60 * 60 * 1000) }, // Ferry
          { id: 'pMtl19', name: 'Hébergement – Hôtel Tadoussac', type: 'hotel', location: 'Tadoussac', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('21/09/2025 – 15h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('21/09/2025 – 15h00 (UTC-4)').getTime() + 2 * 24 * 60 * 60 * 1000) }, // 2 nuits
          { id: 'pMtl20', name: 'Excursion – Safari baleines Zodiac', type: 'activity', location: 'Tadoussac', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('22/09/2025 – 09h30 (UTC-4)'), endDate: this.parseDateWithOffset('22/09/2025 – 12h00 (UTC-4)') },
          { id: 'pMtl21', name: 'Retour à Montréal', type: 'transport', location: 'Tadoussac / Montréal', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('23/09/2025 – 10h00 (UTC-4)'), endDate: this.parseDateWithOffset('23/09/2025 – 16h30 (UTC-4)') },
          { id: 'pMtl22', name: 'Hébergement – Hôtel Le Germain Montréal', type: 'hotel', location: 'Montréal', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('23/09/2025 – 15h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('23/09/2025 – 15h00 (UTC-4)').getTime() + 2 * 24 * 60 * 60 * 1000) }, // 2 nuits
          { id: 'pMtl23', name: 'Retour voiture – Montréal Aéroport', type: 'car_rental', location: 'Montréal', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('25/09/2025 – 10h00 (UTC-4)'), endDate: new Date(this.parseDateWithOffset('25/09/2025 – 10h00 (UTC-4)').getTime() + 30 * 60 * 1000) }, // 30 min pour le retour
          { id: 'pMtl24', name: 'Vol retour – Montréal → Genève', type: 'flight', location: 'Montréal / Genève', timezone: 'America/Toronto', startDate: this.parseDateWithOffset('25/09/2025 – 15h15 (UTC-4)'), endDate: this.parseDateWithOffset('26/09/2025 – 06h30 (UTC+2)') },
        ]
      },
    ];

    // --- Traitement de chaque voyage selon les exigences ---
    demoTrips.forEach(trip => {

      // 1.a. Logique spécifique au voyage passé (Marrakech)
      // Applique un décalage fixe pour s'assurer qu'il est bien passé par rapport à 'now'
      if (trip.id === 'marrakechGeminiGenerated') {
        const pastOffsetMs = -(60 * 24 * 60 * 60 * 1000); // -60 jours en millisecondes
        trip.plans.forEach(plan => {
          plan.startDate = new Date(plan.startDate.getTime() + pastOffsetMs);
          plan.endDate = new Date(plan.endDate.getTime() + pastOffsetMs);
        });
      }

      // 1.b. Logique spécifique au voyage en cours (Athènes)
      if (trip.id === 'athensGeminiGenerated') {
        const firstFlight = trip.plans.find(p => p.type === 'flight' && p.name.includes('Vol Aller Genève → Athènes'));
        if (firstFlight) {
          const flightDurationMs = firstFlight.endDate.getTime() - firstFlight.startDate.getTime();
          // Calcule un nouveau temps de début pour le premier vol
          const newFirstStart = new Date(now.getTime() - flightDurationMs / 3);
          // Calcule le décalage à appliquer à tous les plans
          const offsetMs = newFirstStart.getTime() - firstFlight.startDate.getTime();

          // Applique le même décalage `offsetMs` à toutes les entrées `startDate` et `endDate`
          // de tous les plans du voyage en cours.
          trip.plans.forEach(plan => {
            plan.startDate = new Date(plan.startDate.getTime() + offsetMs);
            plan.endDate = new Date(plan.endDate.getTime() + offsetMs);
          });
        }
      }

      // 1.c. Logique spécifique au voyage futur (Montréal)
      // Applique un décalage fixe de +60 jours pour s'assurer qu'il est bien futur
      if (trip.id === 'montrealGeminiGenerated') {
        const futureOffsetMs = 60 * 24 * 60 * 60 * 1000; // 60 jours en millisecondes
        trip.plans.forEach(plan => {
          plan.startDate = new Date(plan.startDate.getTime() + futureOffsetMs);
          plan.endDate = new Date(plan.endDate.getTime() + futureOffsetMs);
        });
      }

      // Itère sur chaque plan de chaque voyage pour appliquer les transformations
      trip.plans.forEach(plan => {
        const originalPlanDurationMs = plan.endDate.getTime() - plan.startDate.getTime();

        // 3a. Conversion du fuseau horaire (PREMIÈRE FOIS)
        // Ajuste l'objet Date pour que ses getters locaux reflètent le fuseau horaire du plan.
        plan.startDate = this.timezoneConverterServiceGeminiGenerated.convertToLocal(plan.startDate, plan.timezone);
        plan.endDate = this.timezoneConverterServiceGeminiGenerated.convertToLocal(plan.endDate, plan.timezone);

        // 2. Réalisme de l'heure de la journée (06:00–22:00 local)
        // Maintenant, plan.startDate.getHours() retourne l'heure dans le fuseau horaire du plan.
        const planStartHour = plan.startDate.getHours();

        if (planStartHour < 6 || planStartHour > 22) {
          // Si l'heure de début tombe en dehors de 06h00-22h00, ajuste à 10h00
          // Si l'heure est après 22h, on décale au lendemain 10h.
          // Si l'heure est avant 6h, on décale à 10h le même jour.
          if (planStartHour > 22) {
            plan.startDate.setDate(plan.startDate.getDate() + 1); // Passe au jour suivant
          }
          plan.startDate.setHours(10, 0, 0, 0); // Règle à 10:00 AM dans le fuseau horaire du plan.

          // Recalcule la date de fin en conservant la durée originale du plan
          plan.endDate = new Date(plan.startDate.getTime() + originalPlanDurationMs);

          // 3b. Re-conversion du fuseau horaire (SECONDE FOIS - "enrichissement après corrections")
          // Nécessaire car setHours modifie la date en fonction du fuseau horaire du système.
          plan.startDate = this.timezoneConverterServiceGeminiGenerated.convertToLocal(plan.startDate, plan.timezone);
          plan.endDate = this.timezoneConverterServiceGeminiGenerated.convertToLocal(plan.endDate, plan.timezone);
        }
      });

      // 4. Ordre chronologique
      // Trie les plans de chaque voyage par `startDate` ascendante
      trip.plans.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      // 5. Mise à jour des limites du voyage et du statut
      if (trip.plans.length > 0) {
        // Recalcule et écrase les dates de début et de fin du voyage
        trip.startDate = new Date(Math.min(...trip.plans.map(p => p.startDate.getTime())));
        trip.endDate = new Date(Math.max(...trip.plans.map(p => p.endDate.getTime())));

        // Calcule le statut du voyage ('past', 'ongoing', 'upcoming')
        if (now.getTime() > trip.endDate.getTime()) {
          trip.status = 'past';
        } else if (now.getTime() >= trip.startDate.getTime() && now.getTime() <= trip.endDate.getTime()) {
          trip.status = 'ongoing';
        } else {
          trip.status = 'upcoming';
        }

        // Initialise showDetails et calcule les statuts des plans
        trip.showDetails = false;
        
        // Calcule les statuts des plans individuels
        trip.plans.forEach(plan => {
          const planStart = plan.startDate.getTime();
          const planEnd = plan.endDate.getTime();
          const nowMs = now.getTime();
          
          if (nowMs < planStart) {
            plan.status = 'upcoming';
          } else if (nowMs > planEnd) {
            plan.status = 'past';
          } else {
            plan.status = 'ongoing';
          }
        });
      } else {
        // Gère les voyages sans plans (par exemple, définit le statut par défaut)
        trip.status = 'upcoming'; // Statut par défaut pour les voyages vides
        trip.showDetails = false;
      }
    });

    // 6. Filtrage pour l'affichage
    // Popule les tableaux de voyages filtrés en fonction du statut recalculé
    this.pastTripsGenerated = demoTrips.filter(t => t.status === 'past');
    this.ongoingTripsGenerated = demoTrips.filter(t => t.status === 'ongoing');
    this.upcomingTripsGenerated = demoTrips.filter(t => t.status === 'upcoming');
  }

  /**
   * Gère l'événement de changement de segment pour mettre à jour les voyages affichés.
   * @param event L'événement personnalisé de ion-segment.
   */
  segmentChangedGeminiGenerated(event: any): void {
    this.selectedSegmentGenerated = event.detail.value;
  }

  /**
   * Helper pour formater les dates pour l'affichage.
   * @param date La date à formater.
   * @returns Une chaîne de caractères de date formatée (ex: "Jul 18, 2025").
   */
  formatDateGeminiGenerated(date: Date): string {
    // Utilise toLocaleDateString avec l'option timeZone pour afficher la date dans le fuseau horaire du plan.
    // Note: Le service convertToLocal a déjà ajusté l'objet Date pour que ses getters locaux
    // reflètent le fuseau horaire du plan. Donc, l'option timeZone ici n'est pas strictement nécessaire
    // si convertToLocal est parfait, mais c'est une bonne pratique pour la robustesse.
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /**
   * Helper pour formater l'heure pour l'affichage.
   * @param date La date à formater.
   * @returns Une chaîne de caractères d'heure formatée (ex: "03:44 PM").
   */
  formatTimeGeminiGenerated(date: Date): string {
    // Utilise toLocaleTimeString avec l'option timeZone pour afficher l'heure dans le fuseau horaire du plan.
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  // Méthodes pour le nouveau template moderne
  refreshData() {
    this.loadAndProcessDemoTripsGeminiGenerated();
  }

  addNewTrip() {
    console.log('Ajouter un nouveau voyage');
  }

  toggleTripDetails(trip: any) {
    trip.showDetails = !trip.showDetails;
    console.log('Toggle trip details:', {
      tripName: trip.name,
      showDetails: trip.showDetails,
      plansCount: trip.plans?.length
    });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'ongoing': return 'airplane';
      case 'upcoming': return 'calendar';
      case 'past': return 'time';
      default: return 'help-circle';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ongoing': return 'En cours';
      case 'upcoming': return 'À venir';
      case 'past': return 'Terminé';
      default: return 'Inconnu';
    }
  }

  getTripDuration(trip: any): string {
    const start = trip.startDate;
    const end = trip.endDate;
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} jour${days > 1 ? 's' : ''}`;
  }

  getCountdown(startDate: any): string {
    const start = startDate;
    const now = new Date();
    const diff = start.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `Dans ${days} jour${days > 1 ? 's' : ''}`;
  }

  hasFlights(trip: any): boolean {
    return trip.plans?.some((p: any) => p.type === 'flight') || false;
  }

  getFlightsCount(trip: any): number {
    return trip.plans?.filter((p: any) => p.type === 'flight').length || 0;
  }

  hasHotels(trip: any): boolean {
    return trip.plans?.some((p: any) => p.type === 'hotel') || false;
  }

  getHotelsCount(trip: any): number {
    return trip.plans?.filter((p: any) => p.type === 'hotel').length || 0;
  }

  hasActivities(trip: any): boolean {
    return trip.plans?.some((p: any) => p.type === 'activity') || false;
  }

  getActivitiesCount(trip: any): number {
    return trip.plans?.filter((p: any) => p.type === 'activity').length || 0;
  }

  shareTrip(trip: any, event: Event) {
    event.stopPropagation();
    console.log('Partager le voyage:', trip);
  }

  editTrip(trip: any, event: Event) {
    event.stopPropagation();
    console.log('Éditer le voyage:', trip);
  }

  showTripMenu(trip: any, event: Event) {
    event.stopPropagation();
    console.log('Menu du voyage:', trip);
  }

  addPlanToTrip(trip: any, event?: Event) {
    if (event) event.stopPropagation();
    console.log('Ajouter un plan au voyage:', trip);
  }



  uploadImage(trip: any, event: Event) {
    event.stopPropagation();
    console.log('Uploader une image pour:', trip);
  }

  // Méthodes pour la timeline
  isSameDay(date1: any, date2: any): boolean {
    if (!date1 || !date2) return false;
    const d1 = date1;
    const d2 = date2;
    return d1.toDateString() === d2.toDateString();
  }

  formatPlanDay(date: any): string {
    const d = date;
    return d.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }

  getPlanIcon(type: string): string {
    switch (type) {
      case 'flight': return 'airplane';
      case 'hotel': return 'bed';
      case 'car_rental': return 'car';
      case 'activity': return 'walk';
      case 'transport': return 'boat';
      default: return 'time';
    }
  }

  getPlanTypeLabel(type: string): string {
    switch (type) {
      case 'flight': return 'Vol';
      case 'hotel': return 'Hôtel';
      case 'activity': return 'Activité';
      case 'car_rental': return 'Location de voiture';
      case 'transport': return 'Transport';
      default: return 'Plan';
    }
  }

  getPlanLineColor(type: string): string {
    switch (type) {
      case 'flight': return '#4facfe';
      case 'hotel': return '#f093fb';
      case 'activity': return '#43e97b';
      case 'car_rental': return '#667eea';
      case 'transport': return '#f5576c';
      default: return '#6c757d';
    }
  }

  getPlanStatusLabel(status: string): string {
    switch (status) {
      case 'past': return 'Terminé';
      case 'completed': return 'Terminé';
      case 'ongoing': return 'En cours';
      case 'upcoming': return 'À venir';
      default: return 'À venir';
    }
  }

  showPlanMenu(plan: any, event: Event) {
    event.stopPropagation();
    console.log('Menu du plan:', plan);
  }

  getAddPlanSVG(): string {
    return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  getTabLabel(segment: 'ongoing' | 'upcoming' | 'past'): string {
    // Détection simple de la langue basée sur la langue du navigateur
    const language = navigator.language || 'fr';
    const isEnglish = language.startsWith('en');
    
    switch (segment) {
      case 'ongoing':
        return isEnglish ? 'Ongoing Trips' : 'Voyages en cours';
      case 'upcoming':
        return isEnglish ? 'Upcoming Trips' : 'Voyages à venir';
      case 'past':
        return isEnglish ? 'Past Trips' : 'Voyages passés';
      default:
        return segment;
    }
  }

  getPageTitle(): string {
    // Détection simple de la langue basée sur la langue du navigateur
    const language = navigator.language || 'fr';
    const isEnglish = language.startsWith('en');
    
    return isEnglish ? 'Smart Travel Assistant' : 'Assistant Voyage Intelligent';
  }

  // Méthodes pour le modal d'image
  openImageModal(trip: any) {
    this.selectedTripForImage = trip;
    this.showImageModal = true;
    this.activeTab = 'upload';
    this.selectedFile = null;
    this.customImageUrl = '';
  }

  closeImageModal() {
    this.showImageModal = false;
    this.selectedTripForImage = null;
    this.selectedFile = null;
    this.customImageUrl = '';
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadSelectedFile() {
    if (this.selectedFile && this.selectedTripForImage) {
      // Simuler l'upload - en réalité, on utiliserait un service
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedTripForImage.image = e.target.result;
        this.closeImageModal();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  useCustomUrl() {
    if (this.customImageUrl && this.selectedTripForImage) {
      this.selectedTripForImage.image = this.customImageUrl;
      this.closeImageModal();
    }
  }

  changeTripImage(imageUrl: string) {
    if (this.selectedTripForImage) {
      this.selectedTripForImage.image = imageUrl;
      this.closeImageModal();
    }
  }

  onImageError(event: any) {
    console.log('Erreur de chargement d\'image:', event);
  }
}
