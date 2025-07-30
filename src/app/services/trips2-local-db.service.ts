import { Injectable } from '@angular/core';
import { PlanGenerated, TripGenerated } from '../trips2/models/trip-gemini-generated.model';
import { Trips2ImageService } from './trips2-image.service';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class Trips2LocalDBService {
  private readonly DB_NAME = 'Trips2LocalDB';
  private readonly DB_VERSION = 1;
  private readonly TRIPS_STORE = 'trips';
  private readonly PLANS_STORE = 'plans';
  
  private db: IDBDatabase | null = null;

  constructor(private imageService: Trips2ImageService) {
    this.initDatabase();
  }

  /**
   * Initialise la base de données IndexedDB
   */
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('[Trips2LocalDB] Erreur lors de l\'ouverture de la DB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[Trips2LocalDB] Base de données initialisée avec succès');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Créer le store pour les voyages
        if (!db.objectStoreNames.contains(this.TRIPS_STORE)) {
          const tripsStore = db.createObjectStore(this.TRIPS_STORE, { keyPath: 'id' });
          tripsStore.createIndex('userId', 'userId', { unique: false });
          tripsStore.createIndex('status', 'status', { unique: false });
          console.log('[Trips2LocalDB] Store trips créé');
        }

        // Créer le store pour les plans
        if (!db.objectStoreNames.contains(this.PLANS_STORE)) {
          const plansStore = db.createObjectStore(this.PLANS_STORE, { keyPath: 'id' });
          plansStore.createIndex('tripId', 'tripId', { unique: false });
          plansStore.createIndex('userId', 'userId', { unique: false });
          plansStore.createIndex('type', 'type', { unique: false });
          console.log('[Trips2LocalDB] Store plans créé');
        }
      };
    });
  }

  /**
   * Sauvegarde un voyage avec ses plans dans la DB locale
   */
  async saveTripWithPlans(trip: TripGenerated): Promise<void> {
    await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.TRIPS_STORE, this.PLANS_STORE], 'readwrite');
      
      // Sauvegarder le voyage
      const tripsStore = transaction.objectStore(this.TRIPS_STORE);
      const tripData = {
        ...trip,
        lastUpdated: new Date().toISOString()
      };
      
      const tripRequest = tripsStore.put(tripData);
      
      tripRequest.onsuccess = () => {
        console.log(`[Trips2LocalDB] Voyage sauvegardé: ${trip.id}`);
      };
      
      tripRequest.onerror = () => {
        console.error('[Trips2LocalDB] Erreur sauvegarde voyage:', tripRequest.error);
        reject(tripRequest.error);
      };

      // Sauvegarder les plans
      if (trip.plans && trip.plans.length > 0) {
        const plansStore = transaction.objectStore(this.PLANS_STORE);
        
        for (const plan of trip.plans) {
          const planData = {
            ...plan,
            tripId: trip.id,
            lastUpdated: new Date().toISOString()
          };
          
          const planRequest = plansStore.put(planData);
          
          planRequest.onsuccess = () => {
            console.log(`[Trips2LocalDB] Plan sauvegardé: ${plan.id}`);
          };
          
          planRequest.onerror = () => {
            console.error('[Trips2LocalDB] Erreur sauvegarde plan:', planRequest.error);
          };
        }
      }

      transaction.oncomplete = async () => {
        console.log('[Trips2LocalDB] Transaction terminée avec succès');
        
        // Sauvegarder l'image du voyage si elle existe
        if (trip.image && trip.image !== '') {
          try {
            await this.imageService.saveImage(trip.id, trip.image);
            console.log(`[Trips2LocalDB] Image sauvegardée pour le voyage: ${trip.id}`);
          } catch (error) {
            console.error('[Trips2LocalDB] Erreur sauvegarde image:', error);
          }
        }
        
        resolve();
      };

      transaction.onerror = () => {
        console.error('[Trips2LocalDB] Erreur transaction:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Récupère tous les voyages depuis la DB locale
   */
  getTripsWithPlans(): Observable<TripGenerated[]> {
    console.log('[Trips2LocalDB] Début du chargement des voyages...');
    
    return from(this.loadTripsFromLocalDB()).pipe(
      map(trips => {
        console.log(`[Trips2LocalDB] ${trips.length} voyages chargés depuis la DB locale`);
        trips.forEach((trip, index) => {
          console.log(`[Trips2LocalDB] Voyage ${index + 1}: ${trip.name} (${trip.status}) - ${trip.plans?.length || 0} plans`);
        });
        return trips;
      }),
      catchError(error => {
        console.error('[Trips2LocalDB] Erreur lors du chargement:', error);
        return of([]);
      })
    );
  }

  /**
   * Met à jour un plan dans la DB locale
   */
  async updatePlan(plan: PlanGenerated, tripId: string): Promise<void> {
    await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.PLANS_STORE], 'readwrite');
      const plansStore = transaction.objectStore(this.PLANS_STORE);
      
      const planData = {
        ...plan,
        tripId: tripId,
        lastUpdated: new Date().toISOString()
      };
      
      const request = plansStore.put(planData);
      
      request.onsuccess = () => {
        console.log(`[Trips2LocalDB] Plan mis à jour: ${plan.id}`);
        resolve();
      };
      
      request.onerror = () => {
        console.error('[Trips2LocalDB] Erreur mise à jour plan:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Supprime tous les voyages de la DB locale
   */
  async clearAllData(): Promise<void> {
    await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.TRIPS_STORE, this.PLANS_STORE], 'readwrite');
      
      // Vider le store des voyages
      const tripsStore = transaction.objectStore(this.TRIPS_STORE);
      const tripsRequest = tripsStore.clear();
      
      // Vider le store des plans
      const plansStore = transaction.objectStore(this.PLANS_STORE);
      const plansRequest = plansStore.clear();
      
      transaction.oncomplete = () => {
        console.log('[Trips2LocalDB] Toutes les données supprimées');
        resolve();
      };
      
      transaction.onerror = () => {
        console.error('[Trips2LocalDB] Erreur suppression:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  /**
   * Synchronise les données locales avec Firestore (si connecté)
   */
  async syncWithFirestore(firestoreTrips: TripGenerated[]): Promise<void> {
    await this.waitForDB();
    
    console.log('[Trips2LocalDB] Synchronisation avec Firestore...');
    
    // Supprimer les anciennes données
    await this.clearAllData();
    
    // Sauvegarder les nouvelles données
    for (const trip of firestoreTrips) {
      await this.saveTripWithPlans(trip);
    }
    
    console.log('[Trips2LocalDB] Synchronisation terminée');
  }

  /**
   * Récupère les statistiques de la DB locale
   */
  async getDatabaseStats(): Promise<{ trips: number; plans: number; lastUpdate: string }> {
    await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.TRIPS_STORE, this.PLANS_STORE], 'readonly');
      
      const tripsStore = transaction.objectStore(this.TRIPS_STORE);
      const plansStore = transaction.objectStore(this.PLANS_STORE);
      
      const tripsCountRequest = tripsStore.count();
      const plansCountRequest = plansStore.count();
      
      let tripsCount = 0;
      let plansCount = 0;
      let lastUpdate = '';
      
      tripsCountRequest.onsuccess = () => {
        tripsCount = tripsCountRequest.result;
      };
      
      plansCountRequest.onsuccess = () => {
        plansCount = plansCountRequest.result;
      };
      
      // Récupérer la date de dernière mise à jour
      const tripsRequest = tripsStore.getAll();
      tripsRequest.onsuccess = () => {
        const trips = tripsRequest.result;
        if (trips.length > 0) {
          const dates = trips.map(t => t.lastUpdated).filter(Boolean);
          if (dates.length > 0) {
            lastUpdate = new Date(Math.max(...dates.map(d => new Date(d).getTime()))).toLocaleString();
          }
        }
        
        resolve({
          trips: tripsCount,
          plans: plansCount,
          lastUpdate: lastUpdate || 'Jamais'
        });
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  /**
   * Charge les voyages depuis la DB locale
   */
  private async loadTripsFromLocalDB(): Promise<TripGenerated[]> {
    await this.waitForDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.TRIPS_STORE, this.PLANS_STORE], 'readonly');
      
      const tripsStore = transaction.objectStore(this.TRIPS_STORE);
      const plansStore = transaction.objectStore(this.PLANS_STORE);
      
      const tripsRequest = tripsStore.getAll();
      
      tripsRequest.onsuccess = () => {
        const tripsData = tripsRequest.result;
        const trips: TripGenerated[] = [];
        
        // Pour chaque voyage, charger ses plans
        const loadPlansPromises = tripsData.map((tripData) => {
          const plansRequest = plansStore.index('tripId').getAll(tripData.id);
          
          return new Promise<void>((resolvePlan) => {
            plansRequest.onsuccess = () => {
              const plans = plansRequest.result.map((planData: any) => ({
                id: planData.id,
                name: planData.name,
                type: planData.type,
                location: planData.location,
                timezone: planData.timezone,
                startDate: new Date(planData.startDate),
                endDate: new Date(planData.endDate),
                status: planData.status,
                details: planData.details
              }));
              
              // Récupérer l'image locale si elle existe (sans await ici)
              let localImage = tripData.image || '';
              
              trips.push({
                id: tripData.id,
                name: tripData.name,
                description: tripData.description,
                image: localImage,
                startDate: new Date(tripData.startDate),
                endDate: new Date(tripData.endDate),
                status: tripData.status,
                plans: plans,
                showDetails: tripData.showDetails || false
              });
              
              resolvePlan();
            };
          });
        });
        
        Promise.all(loadPlansPromises).then(() => {
          resolve(trips);
        });
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  /**
   * Attend que la DB soit initialisée
   */
  private async waitForDB(): Promise<void> {
    if (this.db) {
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      const checkDB = () => {
        if (this.db) {
          resolve();
        } else {
          setTimeout(checkDB, 100);
        }
      };
      checkDB();
    });
  }

  /**
   * Vérifie si la DB locale est disponible
   */
  isLocalDBAvailable(): boolean {
    return this.db !== null;
  }

  /**
   * Exporte les données locales en JSON
   */
  async exportData(): Promise<string> {
    const trips = await this.loadTripsFromLocalDB();
    return JSON.stringify(trips, null, 2);
  }

  /**
   * Importe des données JSON dans la DB locale
   */
  async importData(jsonData: string): Promise<void> {
    try {
      const trips: TripGenerated[] = JSON.parse(jsonData);
      
      // Supprimer les anciennes données
      await this.clearAllData();
      
      // Importer les nouvelles données
      for (const trip of trips) {
        await this.saveTripWithPlans(trip);
      }
      
      console.log('[Trips2LocalDB] Données importées avec succès');
    } catch (error) {
      console.error('[Trips2LocalDB] Erreur lors de l\'import:', error);
      throw error;
    }
  }
} 