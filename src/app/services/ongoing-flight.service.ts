import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface OngoingFlightInfo {
  flightNumber: string;
  airline: string;
  departure: string;
  arrival: string;
  departureIata: string;
  arrivalIata: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  status: string;
  tripId?: string;
  planId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OngoingFlightService {
  private ongoingFlightSubject = new BehaviorSubject<OngoingFlightInfo | null>(null);
  public ongoingFlight$ = this.ongoingFlightSubject.asObservable();

  // Variables globales pour stocker les informations du vol en cours
  public currentFlightNumber: string = '';
  public currentDepartureTime: string = '';
  public currentArrivalTime: string = '';
  public currentDepartureIata: string = '';
  public currentArrivalIata: string = '';
  public currentAirline: string = '';

  constructor() {
    console.log('[OngoingFlightService] Service initialisé');
  }

  /**
   * Définit le vol en cours
   */
  setOngoingFlight(flightInfo: OngoingFlightInfo): void {
    console.log('[OngoingFlightService] Définition du vol en cours:', flightInfo);
    this.ongoingFlightSubject.next(flightInfo);
    
    // Mettre à jour les variables globales
    this.currentFlightNumber = flightInfo.flightNumber;
    this.currentDepartureTime = flightInfo.scheduledDeparture;
    this.currentArrivalTime = flightInfo.scheduledArrival;
    this.currentDepartureIata = flightInfo.departureIata;
    this.currentArrivalIata = flightInfo.arrivalIata;
    this.currentAirline = flightInfo.airline;
    
    console.log('[OngoingFlightService] Variables globales mises à jour:');
    console.log('[OngoingFlightService] - Numéro de vol:', this.currentFlightNumber);
    console.log('[OngoingFlightService] - Heure départ:', this.currentDepartureTime);
    console.log('[OngoingFlightService] - Heure arrivée:', this.currentArrivalTime);
    console.log('[OngoingFlightService] - Départ IATA:', this.currentDepartureIata);
    console.log('[OngoingFlightService] - Arrivée IATA:', this.currentArrivalIata);
    console.log('[OngoingFlightService] - Compagnie:', this.currentAirline);
    
    // Sauvegarder en localStorage pour persistance
    localStorage.setItem('ongoingFlight', JSON.stringify(flightInfo));
    localStorage.setItem('currentFlightNumber', this.currentFlightNumber);
    localStorage.setItem('currentDepartureTime', this.currentDepartureTime);
    localStorage.setItem('currentArrivalTime', this.currentArrivalTime);
    localStorage.setItem('currentDepartureIata', this.currentDepartureIata);
    localStorage.setItem('currentArrivalIata', this.currentArrivalIata);
    localStorage.setItem('currentAirline', this.currentAirline);
    
    console.log('[OngoingFlightService] Vol sauvegardé dans localStorage');
    
    // Vérification immédiate
    const saved = localStorage.getItem('ongoingFlight');
    console.log('[OngoingFlightService] Vérification localStorage:', saved);
  }

  /**
   * Récupère le vol en cours actuel
   */
  getOngoingFlight(): OngoingFlightInfo | null {
    const current = this.ongoingFlightSubject.value;
    if (current) {
      return current;
    }
    
    // Essayer de récupérer depuis localStorage
    const saved = localStorage.getItem('ongoingFlight');
    if (saved) {
      try {
        const flightInfo = JSON.parse(saved);
        console.log('[OngoingFlightService] Vol en cours récupéré depuis localStorage:', flightInfo);
        this.ongoingFlightSubject.next(flightInfo);
        return flightInfo;
      } catch (error) {
        console.error('[OngoingFlightService] Erreur parsing localStorage:', error);
        localStorage.removeItem('ongoingFlight');
      }
    }
    
    return null;
  }

  /**
   * Efface le vol en cours
   */
  clearOngoingFlight(): void {
    console.log('[OngoingFlightService] Effacement du vol en cours');
    this.ongoingFlightSubject.next(null);
    localStorage.removeItem('ongoingFlight');
  }

  /**
   * Vérifie s'il y a un vol en cours
   */
  hasOngoingFlight(): boolean {
    return this.getOngoingFlight() !== null;
  }



  /**
   * Récupère les informations complètes du vol en cours
   */
  getCurrentFlightInfo(): OngoingFlightInfo | null {
    return this.getOngoingFlight();
  }

  /**
   * Récupère le numéro de vol en cours depuis les variables globales
   */
  getCurrentFlightNumber(): string {
    return this.currentFlightNumber || localStorage.getItem('currentFlightNumber') || '';
  }

  /**
   * Récupère l'heure de départ depuis les variables globales
   */
  getCurrentDepartureTime(): string {
    return this.currentDepartureTime || localStorage.getItem('currentDepartureTime') || '';
  }

  /**
   * Récupère l'heure d'arrivée depuis les variables globales
   */
  getCurrentArrivalTime(): string {
    return this.currentArrivalTime || localStorage.getItem('currentArrivalTime') || '';
  }

  /**
   * Récupère le code IATA de départ depuis les variables globales
   */
  getCurrentDepartureIata(): string {
    return this.currentDepartureIata || localStorage.getItem('currentDepartureIata') || '';
  }

  /**
   * Récupère le code IATA d'arrivée depuis les variables globales
   */
  getCurrentArrivalIata(): string {
    return this.currentArrivalIata || localStorage.getItem('currentArrivalIata') || '';
  }

  /**
   * Récupère la compagnie depuis les variables globales
   */
  getCurrentAirline(): string {
    return this.currentAirline || localStorage.getItem('currentAirline') || '';
  }

  /**
   * Affiche toutes les informations du vol en cours dans la console
   */
  displayCurrentFlightInfo(): void {
    console.log('=== VOL EN COURS - VARIABLES GLOBALES ===');
    console.log('Numéro de vol:', this.getCurrentFlightNumber());
    console.log('Compagnie:', this.getCurrentAirline());
    console.log('Départ:', this.getCurrentDepartureIata());
    console.log('Arrivée:', this.getCurrentArrivalIata());
    console.log('Heure départ:', this.getCurrentDepartureTime());
    console.log('Heure arrivée:', this.getCurrentArrivalTime());
    console.log('=========================================');
  }
} 