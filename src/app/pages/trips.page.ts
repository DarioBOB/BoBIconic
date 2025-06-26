/**
 * Page Trips
 * -------------
 * Affiche la liste des voyages de l'utilisateur (avec gestion admin/demo),
 * gère le cache local, la sécurité d'accès, la validation des données,
 * et la récupération des plans associés à chaque voyage.
 * 
 * - Sécurité : accès filtré selon le rôle utilisateur (admin, demo, standard)
 * - Robustesse : fallback cache, gestion des erreurs, notifications utilisateur
 * - UX : messages explicites, chargement progressif, gestion offline
 * - Performance : cache optimisé avec compression et gestion intelligente
 */

import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, ActionSheetController, AlertController } from '@ionic/angular';
import { SharedModule } from '../shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Firestore, collection, query, where, getDocs, Timestamp, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Storage } from '@ionic/storage-angular';
import { DemoService } from '../services/demo.service';
import { getDemoData } from '../demo/demo-data';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LoggerService } from '../services/logger.service';
import { Subscription } from 'rxjs';
import { FlightDataService } from '../services/flight/flight-data.service';
import { FlightData } from '../services/flight/models/flight-data.interface';

// Configuration du cache
const CACHE_CONFIG = {
  TRIPS_MAX_AGE: 15 * 60 * 1000, // 15 minutes
  PLANS_MAX_AGE: 1800000, // 30 minutes pour les plans
  USER_ROLE_MAX_AGE: 300000, // 5 minutes pour les rôles utilisateur
  CLEANUP_INTERVAL: 86400000, // 24 heures pour le nettoyage
  COMPRESSION_THRESHOLD: 1024 // Compresser si > 1KB
} as const;

interface Trip {
  id: string;
  title: string | { fr: string; en: string };
  startDate: Date;
  endDate: Date;
  status: 'ongoing' | 'upcoming' | 'past';
  showDetails: boolean;
  loadingPlans: boolean;
  plans?: Plan[];
  type?: string;
  planError?: string;
  from?: string;
  to?: string;
  userId?: string;
  coverImage?: string;
  priority?: string;
  isShared?: boolean;
}

interface Plan {
  id: string;
  title: any;
  description: string;
  type: 'flight' | 'hotel' | 'car' | 'activity' | 'other' | 'car_rental';
  startDate: Date;
  endDate: Date;
  startTime?: Date;
  endTime?: Date;
  details: any;
  status?: 'upcoming' | 'ongoing' | 'completed'; // Statut du plan
  expanded?: boolean; // Pour l'affichage des détails
}

interface UserRole {
  isAdmin: boolean;
  isDemo: boolean;
  isStandard: boolean;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  compressed?: boolean;
}

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SharedModule, TranslateModule],
  templateUrl: './trips.page.html',
  styleUrls: ['./trips.page.scss']
})
export class TripsPage implements OnInit, OnDestroy {
  selectedSegment: 'ongoing' | 'upcoming' | 'past' = 'ongoing';
  ongoingTrips: Trip[] = [];
  upcomingTrips: Trip[] = [];
  pastTrips: Trip[] = [];
  isLoading = false;
  error: string | null = null;
  userId: string | null = null;
  userRole: UserRole = { isAdmin: false, isDemo: false, isStandard: false };
  private cacheVersion = '1.0.0'; // Version du cache pour la compatibilité
  private userSubscription: Subscription | null = null;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private storage: Storage,
    private translate: TranslateService,
    private toastController: ToastController,
    private logger: LoggerService,
    private demoService: DemoService,
    private flightDataService: FlightDataService
  ) {
    // Initialisation asynchrone déplacée dans ngOnInit
  }

  /**
   * Initialise le stockage
   */
  private async initializeStorage(): Promise<void> {
    try {
      await this.storage.create();
      await this.cleanupCache();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Trips', 'Erreur initialisation storage', {}, new Error(errorMessage));
    }
  }

  async ngOnInit() {
    this.logger.info('Trips', 'Initialisation de la page Trips');
    
    try {
      await this.initializeStorage();
      await this.loadUserRole();
      await this.loadTrips();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Trips', 'Erreur lors de l\'initialisation', { error: errorMessage }, new Error(errorMessage));
    }
  }

  ngOnDestroy() {
    this.logger.info('Trips', 'Destruction de la page Trips');
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  /**
   * Charge le rôle de l'utilisateur courant (admin/demo/standard)
   * avec cache optimisé
   */
  private async loadUserRole() {
    const startTime = Date.now();
    
    try {
      this.userSubscription = user(this.auth).subscribe(async (user) => {
        if (!user) {
          this.logger.warn('Trips', 'Pas d\'utilisateur connecté');
          return;
        }

        this.userId = user.uid;
        this.logger.info('Trips', 'Utilisateur connecté', { userId: user.uid });

        // Charger le rôle depuis le cache d'abord
        const cachedRole = await this.getFromCache<UserRole>(`userRole_${user.uid}`);
        if (cachedRole && typeof cachedRole === 'object' && 'isAdmin' in cachedRole && 'isDemo' in cachedRole) {
          this.userRole = cachedRole;
          this.logger.info('Trips', 'Rôle utilisateur chargé depuis le cache', { role: this.userRole });
        }

        // Charger depuis Firestore
        const userDocRef = doc(this.firestore, `users/${user.uid}`);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          this.userRole = {
            isAdmin: userData['role'] === 'admin',
            isDemo: userData['role'] === 'demo',
            isStandard: userData['role'] === 'standard'
          };
          
          await this.saveToCache(`userRole_${user.uid}`, this.userRole);
          this.logger.info('Trips', 'Rôle utilisateur chargé depuis Firestore', { role: this.userRole });
        } else {
          this.logger.warn('Trips', 'Document utilisateur non trouvé', { userId: user.uid });
          this.userRole = { isAdmin: false, isDemo: false, isStandard: false };
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error('Trips', 'Erreur chargement rôle utilisateur', { userId: this.userId }, new Error(errorMessage));
    } finally {
      this.logger.performance('Trips', 'loadUserRole', startTime);
    }
  }

  /**
   * Vérifie si l'utilisateur courant a accès à un voyage donné
   * @param tripUserId ID utilisateur du voyage
   */
  private async checkAccess(tripUserId: string): Promise<boolean> {
    if (!this.userId) {
      console.log('[Trips] Accès refusé : pas d\'utilisateur connecté');
      return false;
    }
    
    // Les admins ont accès à tous les voyages
    if (this.userRole.isAdmin) {
      console.log('[Trips] Accès accordé : utilisateur admin');
      return true;
    }
    
    // Les utilisateurs en mode démo ont accès aux voyages de démo
    if (this.userRole.isDemo) {
      const hasAccess = tripUserId === 'fUBBVpboDeaUjD6w2nz0xKni9mG3' || tripUserId === 'guest-demo';
      console.log(`[Trips] Utilisateur démo - Accès ${hasAccess ? 'accordé' : 'refusé'} au voyage de ${tripUserId}`);
      return hasAccess;
    }
    
    // Les utilisateurs standards ont accès à leurs propres voyages
    const hasAccess = tripUserId === this.userId;
    console.log(`[Trips] Utilisateur standard - Accès ${hasAccess ? 'accordé' : 'refusé'} au voyage de ${tripUserId}`);
    return hasAccess;
  }

  /**
   * Valide les données d'un voyage (présence des champs, cohérence des dates)
   */
  private async validateTripData(data: any): Promise<boolean> {
    if (!data['title'] || !data['startDate'] || !data['endDate']) {
      const errorKey = 'TRIPS.ERROR_INVALID_DATA';
      await this.showErrorToast(errorKey);
      return false;
    }

    // Vérification des dates
    const startDate = (data['startDate'] as Timestamp).toDate();
    const endDate = (data['endDate'] as Timestamp).toDate();
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || endDate < startDate) {
      const errorKey = 'TRIPS.ERROR_INVALID_DATE';
      await this.showErrorToast(errorKey);
      return false;
    }

    return true;
  }

  /**
   * Valide les données d'un plan (présence des champs, cohérence des dates et type)
   */
  private async validatePlanData(data: any): Promise<boolean> {
    if (!data['title'] || !data['type'] || !data['startDate'] || !data['endDate']) {
      const errorKey = 'TRIPS.ERROR_INVALID_PLAN';
      await this.showErrorToast(errorKey);
      return false;
    }

    // Vérification du type insensible à la casse
    const validTypes = ['flight', 'hotel', 'car', 'activity', 'other', 'car_rental'];
    const planType = (data['type'] as string)?.toLowerCase();
    
    if (!planType || !validTypes.includes(planType)) {
      const errorKey = 'TRIPS.ERROR_INVALID_PLAN_TYPE';
      // Log l'erreur pour le debug sans bloquer l'utilisateur avec un toast
      console.error(`[Trips] Type de plan invalide: ${data['type']}`);
      await this.showErrorToast(errorKey, { type: data['type'] });
      return false;
    }

    return true;
  }

  /**
   * Affiche un toast d'erreur traduit
   * @param key Clé de traduction
   * @param params Paramètres optionnels
   */
  private async showErrorToast(key: string, params?: any) {
    const message = this.translate.instant(key, params);
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  /**
   * Sauvegarde optimisée dans le cache avec compression
   * @param key Clé de cache
   * @param data Données à sauvegarder
   */
  private async saveToCache<T>(key: string, data: T): Promise<void> {
    try {
      const dataString = JSON.stringify(data);
      const shouldCompress = dataString.length > CACHE_CONFIG.COMPRESSION_THRESHOLD;
      
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: this.cacheVersion,
        compressed: shouldCompress
      };

      // Compression simple pour les gros objets
      const entryToStore = shouldCompress 
        ? { ...cacheEntry, data: this.compressData(dataString) }
        : cacheEntry;

      await this.storage.set(key, entryToStore);
      
      console.log(`[Trips] Cache sauvegardé: ${key} (${dataString.length} bytes${shouldCompress ? ', compressé' : ''})`);
    } catch (err) {
      console.error('[Trips] Erreur sauvegarde cache:', err);
    }
  }

  /**
   * Lecture optimisée depuis le cache avec décompression
   * @param key Clé de cache
   * @param maxAgeMs Âge maximum en millisecondes
   * @returns Données en cache ou null
   */
  private async getFromCache<T>(key: string, maxAgeMs: number = CACHE_CONFIG.TRIPS_MAX_AGE): Promise<T | null> {
    try {
      const cached = await this.storage.get(key) as CacheEntry<T>;
      if (!cached) return null;

      // Vérifier la version du cache
      if (cached.version !== this.cacheVersion) {
        console.log(`[Trips] Version cache obsolète pour ${key}, suppression`);
        await this.storage.remove(key);
        return null;
      }

      const age = Date.now() - cached.timestamp;
      if (age > maxAgeMs) {
        console.log(`[Trips] Cache expiré pour ${key} (âge: ${age}ms > ${maxAgeMs}ms)`);
        await this.storage.remove(key);
        return null;
      }

      // Décompression si nécessaire
      if (cached.compressed && typeof cached.data === 'string') {
        cached.data = this.decompressData(cached.data) as T;
      }

      console.log(`[Trips] Cache lu: ${key} (âge: ${age}ms)`);
      return cached.data;
    } catch (err) {
      console.error('[Trips] Erreur lecture cache:', err);
      return null;
    }
  }

  /**
   * Génère une clé de cache optimisée avec séparation par utilisateur
   * @param prefix Préfixe de la clé
   * @param id ID optionnel pour les sous-éléments
   * @returns Clé de cache formatée
   */
  private getCacheKey(prefix: string, id?: string): string {
    const userId = this.userId || 'anonymous';
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, '_');
    return id ? `${prefix}_${sanitizedUserId}_${id}` : `${prefix}_${sanitizedUserId}`;
  }

  /**
   * Compression simple des données (remplace les espaces et optimise la structure)
   * @param dataString Données en string
   * @returns Données compressées
   */
  private compressData(dataString: string): string {
    // Compression simple : suppression des espaces inutiles
    return dataString.replace(/\s+/g, ' ').trim();
  }

  /**
   * Décompression simple des données
   * @param compressedData Données compressées
   * @returns Données décompressées
   */
  private decompressData(compressedData: string): any {
    try {
      return JSON.parse(compressedData);
    } catch (err) {
      console.error('[Trips] Erreur décompression:', err);
      return null;
    }
  }

  /**
   * Nettoyage intelligent du cache
   * - Supprime les entrées expirées
   * - Supprime les entrées de versions obsolètes
   * - Optimise l'espace de stockage
   */
  private async cleanupCache(): Promise<void> {
    try {
      const keys = await this.storage.keys();
      const now = Date.now();
      let cleanedCount = 0;

      for (const key of keys) {
        try {
          const cached = await this.storage.get(key) as CacheEntry<any>;
          if (!cached) continue;

          // Supprimer si version obsolète
          if (cached.version !== this.cacheVersion) {
            await this.storage.remove(key);
            cleanedCount++;
            continue;
          }

          // Supprimer si expiré
          const age = now - cached.timestamp;
          const maxAge = key.includes('plans') ? CACHE_CONFIG.PLANS_MAX_AGE : CACHE_CONFIG.TRIPS_MAX_AGE;
          
          if (age > maxAge) {
            await this.storage.remove(key);
            cleanedCount++;
          }
        } catch (err) {
          // Supprimer les entrées corrompues
          await this.storage.remove(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`[Trips] Nettoyage cache terminé: ${cleanedCount} entrées supprimées`);
      }
    } catch (err) {
      console.error('[Trips] Erreur nettoyage cache:', err);
    }
  }

  /**
   * Convertit les données de vol FR24 en plan de voyage
   */
  private mapFlightDataToPlan(flightData: FlightData): Plan {
    return {
      id: flightData.flightNumber,
      type: 'flight',
      title: flightData.flightNumber,
      description: `${flightData.route.departure.airport} → ${flightData.route.arrival.airport}`,
      startDate: new Date(flightData.route.departure.scheduledTime),
      endDate: new Date(flightData.route.arrival.scheduledTime),
      details: flightData
    } as Plan;
  }

  /**
   * Charge les voyages avec logique spéciale pour le mode démo
   * - Met à jour le cache
   * - Optimisé pour les performances avec cache intelligent
   */
  async loadTrips() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.error = null;

    // --- LOGIQUE DEMO DYNAMIQUE ---
    if (this.userRole.isDemo) {
      console.log('[Trips] Mode Démo détecté. Recalage sur dernier vol LX1820…');
      try {
        // 1️⃣ Charger le trip "ongoing" depuis Firestore
        const docRef = doc(this.firestore, 'trips', 'trip-ongoing');
        const tripSnap = await getDoc(docRef);
        if (!tripSnap.exists()) {
          throw new Error('Trip démo en cours (trip-ongoing) introuvable en base');
        }
        const ongoingTrip = { id: tripSnap.id, ...tripSnap.data() } as Trip;

        // 2️⃣ Récupérer le dernier vol LX1820 complété via FR24
        const lastFlight = await this.flightDataService
          .getLastCompletedFlight('LX1820')
          .toPromise();

        if (!lastFlight) {
          throw new Error('Impossible de récupérer les données du vol LX1820');
        }

        // 3️⃣ Calculer la fenêtre à 1/3 du vol
        const dep0 = new Date(lastFlight.route.departure.actualTime || lastFlight.route.departure.scheduledTime);
        const arr0 = new Date(lastFlight.route.arrival.actualTime || lastFlight.route.arrival.scheduledTime);
        const durationMs = arr0.getTime() - dep0.getTime();
        const nowMs = Date.now();
        const newDep = new Date(nowMs - durationMs / 3);
        const newArr = new Date(newDep.getTime() + durationMs);

        // 4️⃣ Mettre à jour le trip et son unique plan
        ongoingTrip.startDate = newDep;
        ongoingTrip.endDate = newArr;
        ongoingTrip.plans = [
          this.mapFlightDataToPlan({
            ...lastFlight,
            route: {
              ...lastFlight.route,
              departure: { ...lastFlight.route.departure, scheduledTime: newDep.toISOString() },
              arrival: { ...lastFlight.route.arrival, scheduledTime: newArr.toISOString() }
            }
          })
        ];

        // 5️⃣ Poursuivre le traitement standard
        this.processTrips([ongoingTrip]);
        this.isLoading = false;
        return;
      } catch (error) {
        console.error('[Trips] Erreur lors du recalage démo:', error);
        this.error = 'Erreur lors du recalage du voyage démo.';
        this.isLoading = false;
        return;
      }
    }

    // --- LOGIQUE STANDARD (utilisateurs non-démo) ---
    try {
      // Logique Standard (Cache puis Firestore) pour les autres utilisateurs
      const cacheKey = this.getCacheKey('trips', this.userId || undefined);
      const cachedTrips = await this.getFromCache<Trip[]>(cacheKey);

      if (cachedTrips && cachedTrips.length > 0) {
        console.log('[Trips] Voyages en cache:', cachedTrips.length);
        
        // Filtrer les voyages en cache selon les permissions (sans requête Firestore)
        const filteredTrips = cachedTrips.filter(trip => {
          // Pour les utilisateurs standards, on peut faire confiance au cache
          if (!this.userRole.isAdmin && !this.userRole.isDemo) {
            return trip.userId === this.userId;
          }
          
          // Pour les admins, on a accès à tout
          if (this.userRole.isAdmin) {
            return true;
          }
          
          // Pour les démo, on vérifie que c'est bien un voyage de démo
          if (this.userRole.isDemo) {
            return trip.userId === 'fUBBVpboDeaUjD6w2nz0xKni9mG3' || trip.userId === 'guest-demo';
          }
          
          return false;
        });
        
        console.log('[Trips] Voyages filtrés (cache):', filteredTrips.length);
        
        // Mettre à jour les statuts
        filteredTrips.forEach(trip => {
          trip.status = this.getTripStatus(trip.startDate, trip.endDate);
        });
        
        this.processTrips(filteredTrips);
        
        // Afficher immédiatement les données du cache
        if (filteredTrips.length > 0) {
          console.log('[Trips] Données affichées depuis le cache');
        }
      }

      // 2. Charger depuis Firestore en arrière-plan pour mise à jour
      try {
        const tripsRef = collection(this.firestore, 'trips');
        const q = this.userRole.isAdmin 
          ? query(tripsRef) // Admin voit tous les voyages
          : query(tripsRef, where('userId', '==', this.userId)); // Utilisateur standard
        
        const querySnapshot = await getDocs(q);
        console.log('[Trips] Requête Firestore effectuée pour le mode:', this.userRole.isAdmin ? 'admin' : 'standard');

        const trips: Trip[] = [];
        const validationErrors: string[] = [];
        const accessErrors: string[] = [];

        for (const doc of querySnapshot.docs) {
          try {
            const data = doc.data();
            
            // Valider les données
            if (!await this.validateTripData(data)) {
              validationErrors.push(doc.id);
              continue;
            }

            // Vérifier l'accès
            if (!await this.checkAccess(data['userId'])) {
              accessErrors.push(doc.id);
              continue;
            }

            const startDate = (data['startDate'] as Timestamp).toDate();
            const endDate = (data['endDate'] as Timestamp).toDate();
            
            trips.push({
              id: doc.id,
              title: data['title'],
              startDate: startDate,
              endDate: endDate,
              status: this.getTripStatus(startDate, endDate),
              showDetails: false,
              loadingPlans: false,
              type: data['type'] || undefined,
              from: data['from'] || undefined,
              to: data['to'] || undefined,
              userId: data['userId']
            });
          } catch (err) {
            console.error(`[Trips] Erreur parsing voyage ${doc.id}:`, err);
          }
        }

        // Log des erreurs de validation et d'accès
        if (validationErrors.length > 0) {
          console.warn('[Trips] Voyages avec données invalides:', validationErrors);
        }
        if (accessErrors.length > 0) {
          console.warn('[Trips] Voyages avec accès refusé:', accessErrors);
        }

        console.log('[Trips] Voyages Firestore récupérés:', trips.length);

        // Sauvegarder dans le cache
        await this.saveToCache(cacheKey, trips);

        // Mettre à jour l'affichage seulement si on a de nouvelles données
        if (trips.length > 0) {
          this.processTrips(trips);
          console.log('[Trips] Données mises à jour depuis Firestore');
        }

        // Message explicite si aucun voyage trouvé
        if (trips.length === 0 && !cachedTrips?.length) {
          this.error = this.translate.instant('TRIPS.NO_TRIPS_FOUND');
        }

      } catch (firestoreError) {
        console.error('[Trips] Erreur Firestore:', firestoreError);
        
        // Si on a des données en cache, on continue avec celles-ci
        if (cachedTrips && cachedTrips.length > 0) {
          console.log('[Trips] Continuation avec les données du cache en cas d\'erreur Firestore');
          return;
        }
        
        // Sinon, on affiche l'erreur
        throw firestoreError;
      }

    } catch (error) {
      console.error('[Trips] Erreur chargement voyages:', error);
      const errorKey = 'TRIPS.ERROR_LOADING';
      this.error = this.translate.instant(errorKey);
      await this.showErrorToast(errorKey);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Traite les voyages (bruts ou depuis cache) pour les classer
   * dans les bonnes catégories (en cours, à venir, passé).
   */
  private processTrips(trips: Trip[]) {
    const now = new Date();
    this.ongoingTrips = [];
    this.upcomingTrips = [];
    this.pastTrips = [];

    for (const trip of trips) {
      const startDate = new Date(trip.startDate); // Assure que c'est un objet Date
      const endDate = new Date(trip.endDate);     // Assure que c'est un objet Date

      // Trier les plans s'ils sont déjà chargés (cas du mode démo)
      if (trip.plans && trip.plans.length > 0) {
        trip.plans = this.getSortedPlans(trip.plans);
      }

      if (endDate < now) {
        trip.status = 'past';
        this.pastTrips.push(trip);
      } else if (startDate > now) {
        trip.status = 'upcoming';
        this.upcomingTrips.push(trip);
      } else {
        trip.status = 'ongoing';
        this.ongoingTrips.push(trip);
      }
    }

    // Trier chaque catégorie
    this.ongoingTrips.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    this.upcomingTrips.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    this.pastTrips.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()); // Les plus récents en premier
  }

  getTripStatus(startDate: Date, endDate: Date): 'ongoing' | 'upcoming' | 'past' {
    const now = new Date();
    const start = this.toJsDate(startDate);
    const end = this.toJsDate(endDate);

    if (!start || !end) return 'upcoming'; // Default for invalid dates

    if (start > now) return 'upcoming';
    if (end < now) return 'past';
    return 'ongoing';
  }

  // --- Fonctions de tri et de conversion de date ---
  
  private toJsDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    // Gère l'objet Timestamp de Firestore après JSON.stringify
    if (val.seconds) return new Date(val.seconds * 1000);
    // Gère le type Timestamp natif de Firestore
    if (typeof val.toDate === 'function') return val.toDate();
    // Gère les strings ou les nombres
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }

  private getSortedTrips(trips: Trip[]): Trip[] {
    if (!trips) return [];
    return [...trips].sort((a, b) => {
      const dateA = this.toJsDate(a.startDate)?.getTime() || 0;
      const dateB = this.toJsDate(b.startDate)?.getTime() || 0;
      return dateA - dateB;
    });
  }

  private getSortedPlans(plans: Plan[]): Plan[] {
    if (!plans) return [];
    return [...plans].sort((a, b) => {
      const dateA = this.toJsDate(a.startDate)?.getTime() || 0;
      const dateB = this.toJsDate(b.startDate)?.getTime() || 0;
      return dateA - dateB;
    });
  }

  /**
   * Ouvre ou ferme les détails d'un voyage.
   * Charge les plans associés à la première ouverture.
   */
  async toggleTripDetails(trip: Trip) {
    // Inverse l'état d'affichage
    trip.showDetails = !trip.showDetails;

    // Si on ouvre et que les plans n'ont jamais été chargés (et qu'il n'y a pas d'erreur)
    if (trip.showDetails && !trip.plans?.length && !trip.planError) {
      trip.loadingPlans = true;

      try {
        // Pour les utilisateurs normaux, charger depuis le cache ou Firestore
        const cacheKey = this.getCacheKey('plans', trip.id);
        const cachedPlans = await this.getFromCache<Plan[]>(cacheKey, CACHE_CONFIG.PLANS_MAX_AGE);
        
        if (cachedPlans) {
          trip.plans = this.getSortedPlans(cachedPlans.map(p => this.toPlan(p)));
          console.log(`[Trips] Plans pour "${trip.title}" chargés depuis le cache.`);
        } else {
          // Charger depuis Firestore
          const plansQuery = query(collection(this.firestore, 'plans'), where('tripId', '==', trip.id));
          const snapshot = await getDocs(plansQuery);
          
          if (snapshot.empty) {
            console.warn(`[Trips] Aucun plan trouvé pour le voyage ${trip.id}`);
            trip.plans = [];
          } else {
            const plans = snapshot.docs.map(doc => this.toPlan({ ...doc.data(), id: doc.id }));
            trip.plans = this.getSortedPlans(plans);
            await this.saveToCache(cacheKey, trip.plans);
            console.log(`[Trips] Plans pour "${trip.title}" chargés depuis Firestore.`);
          }
        }
      } catch (err) {
        console.error(`[Trips] Erreur chargement plans pour ${trip.id}:`, err);
        trip.planError = this.translate.instant('TRIPS.ERROR_LOADING_PLANS');
      } finally {
        trip.loadingPlans = false;
      }
    }
  }

  getPlanIcon(type?: string): string {
    switch (type) {
      case 'flight':
        return 'airplane';
      case 'hotel':
        return 'bed';
      case 'car':
      case 'car_rental':
        return 'car';
      case 'activity':
        return 'ticket';
      default:
        return 'airplane'; // Icône par défaut pour les voyages
    }
  }

  getPlanColor(type: string): string {
    switch (type) {
      case 'flight':
        return 'primary';
      case 'hotel':
        return 'secondary';
      case 'car':
      case 'car_rental':
        return 'tertiary';
      case 'activity':
        return 'warning';
      default:
        return 'medium';
    }
  }

  getPlanBadgeColor(type: string): string {
    switch (type) {
      case 'flight':
        return 'primary';
      case 'hotel':
        return 'secondary';
      case 'car':
      case 'car_rental':
        return 'tertiary';
      case 'activity':
        return 'warning';
      default:
        return 'medium';
    }
  }

  getCurrentLang(): 'fr' | 'en' {
    return (localStorage.getItem('lang') as 'fr' | 'en') || 'fr';
  }

  getTitle(title: any): string {
    if (typeof title === 'object' && title !== null) {
      const lang = this.getCurrentLang();
      return title[lang] || title.fr || title.en || '';
    }
    return title || '';
  }

  /**
   * Formate une date pour l'affichage des plans, incluant l'heure.
   */
  formatPlanDate(date: any): string {
    const d = this.toJsDate(date);
    if (!d) return '';
    return d.toLocaleString(this.getCurrentLang(), {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTripDate(date: any): string {
    const d = this.toJsDate(date);
    if (!d) return '';
    return d.toLocaleDateString(this.getCurrentLang(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getDescription(desc: any): string {
    if (typeof desc === 'object' && desc !== null) {
      const lang = this.getCurrentLang();
      return desc[lang] || desc.fr || desc.en || '';
    }
    return desc || '';
  }

  getFlightTitle(from: string, to: string): string {
    const currentLang = this.getCurrentLang();
    return `${from} → ${to}`;
  }

  /**
   * Réinitialise les données de démo (pour les utilisateurs démo uniquement)
   */
  async resetDemoData() {
    if (!this.userRole.isDemo) {
      console.warn('[Trips] Tentative de réinitialisation des données démo par un utilisateur non-démo');
      return;
    }

    try {
      // Afficher un toast de chargement
      const loadingToast = await this.toastController.create({
        message: this.translate.instant('TRIPS.RESETTING_DEMO_DATA'),
        position: 'bottom'
      });
      await loadingToast.present();

      // Nettoyer le cache
      await this.cleanupCache();

      // Recharger les voyages (la logique démo dynamique se chargera du reste)
      await this.loadTrips();

      // Fermer le toast de chargement
      await loadingToast.dismiss();

      // Afficher un message de succès
      const successToast = await this.toastController.create({
        message: this.translate.instant('TRIPS.DEMO_DATA_RESET'),
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await successToast.present();

    } catch (error) {
      console.error('[Trips] Erreur réinitialisation données démo:', error);
      const errorToast = await this.toastController.create({
        message: this.translate.instant('TRIPS.ERROR_RESETTING_DEMO_DATA'),
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await errorToast.present();
    }
  }

  /**
   * Force le rechargement des données depuis Firestore (bypass cache)
   */
  async refreshData() {
    try {
      // Vider le cache spécifique aux voyages
      const tripsCacheKey = this.getCacheKey('trips');
      await this.storage.remove(tripsCacheKey);
      
      // Recharger les voyages
      await this.loadTrips();
      
      // Afficher un message de succès
      const toast = await this.toastController.create({
        message: this.translate.instant('TRIPS.DATA_REFRESHED'),
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
      
    } catch (error) {
      console.error('[Trips] Erreur rafraîchissement:', error);
      await this.showErrorToast('TRIPS.ERROR_REFRESHING');
    }
  }

  /**
   * Affiche les statistiques du cache (pour debug)
   */
  async showCacheStats() {
    try {
      const keys = await this.storage.keys();
      const stats = {
        totalEntries: keys.length,
        tripsEntries: keys.filter(k => k.includes('trips')).length,
        plansEntries: keys.filter(k => k.includes('plans')).length,
        userRoleEntries: keys.filter(k => k.includes('userRole')).length,
        otherEntries: keys.filter(k => !k.includes('trips') && !k.includes('plans') && !k.includes('userRole')).length
      };

      const message = `Cache: ${stats.totalEntries} entrées\n` +
                     `- Voyages: ${stats.tripsEntries}\n` +
                     `- Plans: ${stats.plansEntries}\n` +
                     `- Rôles: ${stats.userRoleEntries}\n` +
                     `- Autres: ${stats.otherEntries}`;

      const alert = await this.toastController.create({
        message,
        duration: 5000,
        position: 'bottom',
        color: 'primary'
      });
      await alert.present();
      
    } catch (error) {
      console.error('[Trips] Erreur affichage stats cache:', error);
    }
  }

  /**
   * Vide complètement le cache (méthode d'urgence)
   */
  async clearAllCache() {
    try {
      await this.storage.clear();
      console.log('[Trips] Cache complètement vidé');
      
      const toast = await this.toastController.create({
        message: this.translate.instant('TRIPS.CACHE_CLEARED'),
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      
    } catch (error) {
      console.error('[Trips] Erreur vidage cache:', error);
      await this.showErrorToast('TRIPS.ERROR_CLEARING_CACHE');
    }
  }

  /**
   * Convertit un objet de données en un objet Trip typé.
   * @param data Données brutes du voyage.
   */
  private toTrip(data: any): Trip {
    const startDate = data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate);
    const endDate = data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate);

    return {
      id: data.id,
      title: data.title,
      startDate,
      endDate,
      status: this.getTripStatus(startDate, endDate),
      showDetails: false,
      loadingPlans: false,
      userId: data.userId,
      type: data.type,
      from: data.from,
      to: data.to,
      plans: Array.isArray(data.plans) ? data.plans.map((p: any) => this.toPlan(p)) : []
    };
  }

  /**
   * Mappe les données brutes d'un plan vers l'interface Plan.
   */
  private toPlan(data: any): Plan {
    const startDate = data.startDate instanceof Timestamp ? data.startDate.toDate() : new Date(data.startDate);
    const endDate = data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate);
    const startTime = data.startTime ? (data.startTime instanceof Timestamp ? data.startTime.toDate() : new Date(data.startTime)) : undefined;
    const endTime = data.endTime ? (data.endTime instanceof Timestamp ? data.endTime.toDate() : new Date(data.endTime)) : undefined;

    return {
      id: data.id,
      title: this.getTitle(data.title),
      description: data.description || '',
      type: (data.type?.toLowerCase() || 'other') as Plan['type'],
      startDate,
      endDate,
      startTime,
      endTime,
      details: data.details || {},
      status: 'upcoming',
      expanded: false
    };
  }

  /**
   * Ajoute un nouveau voyage
   */
  async addNewTrip() {
    // TODO: Implémenter la création d'un nouveau voyage
    console.log('[Trips] Ajout d\'un nouveau voyage');
    await this.showErrorToast('TRIPS.ERROR_UNKNOWN', { message: 'Fonctionnalité en cours de développement' });
  }

  /**
   * Obtient l'image de couverture pour un voyage
   */
  getTripCoverImage(trip: Trip): string {
    // Images de couverture par défaut selon le type de voyage
    const coverImages: { [key: string]: string } = {
      ongoing: 'assets/trips/ongoing-cover.jpg',
      upcoming: 'assets/trips/upcoming-cover.jpg',
      past: 'assets/trips/past-cover.jpg'
    };
    
    // Si le voyage a une image personnalisée, l'utiliser
    if (trip.coverImage) {
      return trip.coverImage;
    }
    
    // Sinon, utiliser l'image par défaut selon le statut
    return coverImages[trip.status] || coverImages['upcoming'];
  }

  /**
   * Obtient l'icône de statut pour un voyage
   */
  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      ongoing: 'airplane',
      upcoming: 'calendar',
      past: 'time'
    };
    return statusIcons[status] || 'help-circle';
  }

  /**
   * Obtient la localisation d'un voyage
   */
  getTripLocation(trip: Trip): string {
    if (trip.from && trip.to) {
      return `${trip.from} → ${trip.to}`;
    }
    return this.getTitle(trip.title);
  }

  /**
   * Calcule la durée d'un voyage
   */
  getTripDuration(trip: Trip): string {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '1 jour';
    } else if (diffDays < 7) {
      return `${diffDays} jours`;
    } else {
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      if (remainingDays === 0) {
        return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
      } else {
        return `${weeks} semaine${weeks > 1 ? 's' : ''} ${remainingDays} jour${remainingDays > 1 ? 's' : ''}`;
      }
    }
  }

  /**
   * Télécharge une image depuis la galerie de l'appareil
   */
  async uploadImage(trip: Trip) {
    try {
      console.log(`[Trips] Téléchargement d'une image pour le voyage: ${trip.id}`);
      
      // Utiliser Capacitor Camera pour sélectionner une image depuis la galerie
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      if (image.dataUrl) {
        // Afficher un toast de chargement
        const loadingToast = await this.toastController.create({
          message: 'Sauvegarde de l\'image...',
          duration: 0,
          position: 'bottom'
        });
        await loadingToast.present();

        try {
          // Mettre à jour le document Firestore du voyage avec la nouvelle image
          const tripRef = doc(this.firestore, 'trips', trip.id);
          await updateDoc(tripRef, {
            coverImage: image.dataUrl,
            updatedAt: Timestamp.now()
          });

          // Mettre à jour l'objet trip local
          trip.coverImage = image.dataUrl;

          // Fermer le toast de chargement
          await loadingToast.dismiss();

          // Afficher un toast de succès
          const successToast = await this.toastController.create({
            message: 'Image de couverture mise à jour avec succès !',
            duration: 2000,
            position: 'bottom',
            color: 'success'
          });
          await successToast.present();

          console.log(`[Trips] Image sauvegardée pour le voyage: ${trip.id}`);
        } catch (firestoreError) {
          await loadingToast.dismiss();
          console.error('[Trips] Erreur lors de la sauvegarde dans Firestore:', firestoreError);
          await this.showErrorToast('TRIPS.ERROR_SAVE_IMAGE', { message: 'Erreur lors de la sauvegarde de l\'image' });
        }
      }
    } catch (error) {
      console.error('[Trips] Erreur lors du téléchargement d\'image:', error);
      
      // Ne pas afficher d'erreur si l'utilisateur a annulé la sélection
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as any).message;
        if (!errorMessage.includes('User cancelled') && !errorMessage.includes('User canceled')) {
          await this.showErrorToast('TRIPS.ERROR_UPLOAD_IMAGE', { message: 'Erreur lors de la sélection de l\'image' });
        }
      }
    }
  }

  /**
   * Partage un voyage
   */
  async shareTrip(trip: Trip, event: Event) {
    event.stopPropagation();
    console.log('[Trips] Partage du voyage:', trip.id);
    await this.showErrorToast('TRIPS.ERROR_UNKNOWN', { message: 'Fonctionnalité de partage en cours de développement' });
  }

  /**
   * Édite un voyage
   */
  async editTrip(trip: Trip, event: Event) {
    event.stopPropagation();
    console.log('[Trips] Édition du voyage:', trip.id);
    await this.showErrorToast('TRIPS.ERROR_UNKNOWN', { message: 'Fonctionnalité d\'édition en cours de développement' });
  }

  /**
   * Affiche le menu d'options d'un voyage
   */
  async showTripMenu(trip: Trip, event: Event) {
    event.stopPropagation();
    console.log('[Trips] Menu du voyage:', trip.id);
    await this.showErrorToast('TRIPS.ERROR_UNKNOWN', { message: 'Menu en cours de développement' });
  }

  /**
   * Ajoute un plan à un voyage
   */
  async addPlanToTrip(trip: Trip) {
    console.log('[Trips] Ajout de plan au voyage:', trip.id);
    await this.showErrorToast('TRIPS.ERROR_UNKNOWN', { message: 'Fonctionnalité d\'ajout de plan en cours de développement' });
  }

  /**
   * Édite un plan
   */
  async editPlan(plan: Plan, event: Event) {
    event.stopPropagation();
    console.log('[Trips] Édition du plan:', plan.id);
    await this.showErrorToast('TRIPS.ERROR_UNKNOWN', { message: 'Fonctionnalité d\'édition de plan en cours de développement' });
  }

  /**
   * Affiche le menu d'options d'un plan
   */
  async showPlanMenu(plan: Plan, event: Event) {
    event.stopPropagation();
    console.log('[Trips] Menu du plan:', plan.id);
    await this.showErrorToast('TRIPS.ERROR_UNKNOWN', { message: 'Menu de plan en cours de développement' });
  }

  /**
   * Obtient le label d'un type de plan
   */
  getPlanTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      flight: 'Vol',
      hotel: 'Hôtel',
      activity: 'Activité',
      car_rental: 'Location',
      car: 'Voiture',
      other: 'Autre'
    };
    return typeLabels[type] || 'Autre';
  }

  /**
   * Obtient l'icône de statut d'un plan
   */
  getPlanStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      upcoming: 'time',
      ongoing: 'play',
      completed: 'checkmark-circle'
    };
    return statusIcons[status] || 'help-circle';
  }

  /**
   * Obtient le label de statut d'un plan
   */
  getPlanStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      upcoming: 'À venir',
      ongoing: 'En cours',
      completed: 'Terminé'
    };
    return statusLabels[status] || 'Inconnu';
  }
} 