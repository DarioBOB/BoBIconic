import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FlightPlan } from '../models/flight-plan.model';

@Injectable({
  providedIn: 'root'
})
export class FlightFirestoreService {
  private readonly COLLECTION_NAME = 'flight_plans';
  private readonly CACHE_KEY = 'cachedFlightPlan';

  constructor(private afs: AngularFirestore) {}

  /**
   * Récupère le plan de vol depuis Firestore ou le cache local
   * @param flightId Identifiant du vol (ex: "GVA-ATH-2025-06-05")
   */
  getFlightPlan(flightId: string): Observable<FlightPlan | null> {
    return this.afs
      .collection<FlightPlan>(this.COLLECTION_NAME)
      .doc(flightId)
      .valueChanges()
      .pipe(
        map(plan => {
          if (plan) {
            // Mettre en cache si on reçoit un plan valide
            this.cacheFlightPlan(plan);
            return plan;
          }
          return null;
        }),
        catchError(error => {
          console.warn('Erreur Firestore, tentative de lecture depuis le cache:', error);
          return of(this.getCachedFlightPlan());
        })
      );
  }

  /**
   * Enregistre ou met à jour un plan de vol dans Firestore
   */
  saveFlightPlan(plan: FlightPlan): Promise<void> {
    return this.afs
      .collection(this.COLLECTION_NAME)
      .doc(plan.flightId)
      .set(plan)
      .then(() => {
        // Mettre en cache après sauvegarde réussie
        this.cacheFlightPlan(plan);
      });
  }

  /**
   * Stocke le plan de vol dans le cache local
   */
  private cacheFlightPlan(plan: FlightPlan): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(plan));
    } catch (error) {
      console.error('Erreur lors de la mise en cache:', error);
    }
  }

  /**
   * Récupère le plan de vol depuis le cache local
   */
  private getCachedFlightPlan(): FlightPlan | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Erreur lors de la lecture du cache:', error);
      return null;
    }
  }

  /**
   * Supprime le plan de vol du cache local
   */
  clearCachedFlightPlan(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression du cache:', error);
    }
  }
} 