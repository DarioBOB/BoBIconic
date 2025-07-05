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
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LoggerService } from '../services/logger.service';
import { DateTimeService } from '../services/date-time.service';
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
  company?: string;
  number?: string;
  location?: string;
  confirmation?: string;
  icon?: string; // Icône pour l'affichage dans la timeline
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
  trips: Trip[] = [];
  isLoading = false;
  error: string | null = null;
  userId: string | null = null;
  userRole: UserRole = { isAdmin: false, isDemo: false, isStandard: false };
  private cacheVersion = '1.0.0'; // Version du cache pour la compatibilité
  private userSubscription: Subscription | null = null;
  now: Date = new Date();

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private storage: Storage,
    private translate: TranslateService,
    private toastController: ToastController,
    private logger: LoggerService,
    private demoService: DemoService,
    private flightDataService: FlightDataService,
    private dateTimeService: DateTimeService
  ) {
    setInterval(() => { this.now = new Date(); }, 1000);
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
      if (this.userRole.isDemo) {
        await this.resetDemoData();
      }
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
        setTimeout(async () => {
          const userDocRef = doc(this.firestore, `users/${user.uid}`);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            this.userRole = {
              isAdmin: userData['role'] === 'admin',
              isDemo: userData['role'] === 'demo',
              isStandard: userData['role'] === 'standard'
            };

            // 🔥 Forcer le mode démo pour l'UID démo même si le champ 'role' est absent ou incorrect
            if (user.uid === 'fUBBVpboDeaUjD6w2nz0xKni9mG3' || user.email?.endsWith('@demo.com')) {
              this.userRole.isDemo = true;
              this.logger.warn('Trips', 'Mode démo FORCÉ pour UID démo', { userId: user.uid, email: user.email });
            }
            
            await this.saveToCache(`userRole_${user.uid}`, this.userRole);
            this.logger.info('Trips', 'Rôle utilisateur chargé depuis Firestore', { role: this.userRole });
          } else {
            this.logger.warn('Trips', 'Document utilisateur non trouvé', { userId: user.uid });
            this.userRole = { isAdmin: false, isDemo: false, isStandard: false };
          }
          // Ajout : resetDemoData avant loadTrips si démo
          if (this.userRole.isDemo) {
            await this.resetDemoData();
          }
          await this.loadTrips();
        }, 0);
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
   * Charge la liste des voyages.
   * En mode démo : utilisation de getDynamicDemoData()
   * Sinon : requête classique Firestore + cache.
   */
  async loadTrips() {
    if (this.isLoading) { return; }
    this.isLoading = true;
    this.error     = null;

          // --- MODE DÉMO : on génère les dates et plans dynamiquement ---
      if (this.userRole.isDemo) {
        this.logger.info(
          'Trips',
          'Mode Démo détecté – chargement des voyages dynamiques depuis DemoService'
        );
        try {
          // Forcer le nettoyage du cache local avant de charger les données démo
          console.log('🧹 [TRIPS PAGE] Nettoyage du cache local avant chargement démo...');
          await this.clearAllCache();
          
          // FORCER la mise à jour des données dans Firestore avant de les récupérer
          console.log('🔄 [TRIPS PAGE] Mise à jour des données de démo dans Firestore...');
          await this.demoService.setupDynamicDemoData();
        // getDynamicDemoData() renvoie un tableau de { id, title, startDate, endDate, plans… }
        console.log('🔄 [TRIPS PAGE] Appel getDynamicDemoData()...');
        console.log('🚨 [TRIPS PAGE] DEBUG: Cette ligne doit apparaître dans la console !');
        console.log('🚨 [TRIPS PAGE] DEBUG: Si vous ne voyez pas ces logs, loadTrips n\'est pas appelé !');
        const rawTrips = await this.demoService.getDynamicDemoData();
        console.log('📥 [TRIPS PAGE] Données reçues du service:', rawTrips.length, 'voyages');

        // Transforme en Trip[] avec Date JS et status calculé
        this.trips = rawTrips.map(raw => {
          const sd = this.toJsDate(raw.startDate) || new Date();
          const ed = this.toJsDate(raw.endDate) || new Date();
          
          // --- RECALAGE DYNAMIQUE LOCAL SI LE SERVICE NE FONCTIONNE PAS ---
          const now = new Date();
          let recalculatedStartDate = sd;
          let recalculatedEndDate = ed;
          
          // Identifier le type de voyage par sa position dans la liste
          const tripIndex = rawTrips.indexOf(raw);
          if (tripIndex === 0) {
            // Premier voyage = passé (now - 37j à now - 30j)
            recalculatedStartDate = new Date(now.getTime() - 37 * 24 * 60 * 60 * 1000);
            recalculatedEndDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            console.log('🔄 [TRIPS PAGE] Recalcul local voyage passé:', {
              original: sd.toISOString(),
              recalculated: recalculatedStartDate.toISOString()
            });
          } else if (tripIndex === 1) {
            // Deuxième voyage = en cours (positionné autour de now)
            const flightDuration = 3 * 60 * 60 * 1000; // 3h par défaut
            recalculatedStartDate = new Date(now.getTime() - flightDuration / 3);
            recalculatedEndDate = new Date(now.getTime() + flightDuration * 2 / 3);
            console.log('🔄 [TRIPS PAGE] Recalcul local voyage en cours:', {
              original: sd.toISOString(),
              recalculated: recalculatedStartDate.toISOString()
            });
          } else if (tripIndex === 2) {
            // Troisième voyage = futur (now + 60j à now + 67j)
            recalculatedStartDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
            recalculatedEndDate = new Date(now.getTime() + 67 * 24 * 60 * 60 * 1000);
            console.log('🔄 [TRIPS PAGE] Recalcul local voyage futur:', {
              original: sd.toISOString(),
              recalculated: recalculatedStartDate.toISOString()
            });
          }
          
          // --- DEBUG : log du plan principal (vol) ---
          const mainFlight = raw.plans?.find((p: any) => p.type === 'flight');
          if (mainFlight) {
            console.log('[DEBUG TRIPS PAGE] Vol principal utilisé pour statut:', {
              startDate: mainFlight.startDate,
              endDate: mainFlight.endDate,
              now: new Date().toISOString(),
            });
          } else {
            console.warn('[DEBUG TRIPS PAGE] Aucun vol principal trouvé dans le mapping');
          }
          
          console.log('🔄 [TRIPS PAGE] Transformation voyage:', {
            id: raw.id,
            title: raw.title,
            rawStartDate: raw.startDate,
            rawEndDate: raw.endDate,
            convertedStartDate: recalculatedStartDate.toISOString(),
            convertedEndDate: recalculatedEndDate.toISOString(),
            plansCount: raw.plans?.length || 0
          });
          
          return {
            id: raw.id,
            title: raw.title,
            startDate: recalculatedStartDate,
            endDate: recalculatedEndDate,
            status: this.getTripStatus(recalculatedStartDate, recalculatedEndDate),
            showDetails: false,
            loadingPlans: false,
            plans: (raw.plans || []).map((p: any) => ({
              ...p,
              startDate: this.toJsDate(p.startDate) || new Date(),
              endDate: this.toJsDate(p.endDate) || new Date(),
              icon: p.icon || this.getPlanIcon(p.type)
            }))
          };
        });
        
        // Tous les trips ont leurs plans attachés dès maintenant (pas de lazy loading)
        this.processTrips(this.trips);
        console.log('✅ [TRIPS PAGE] Voyages traités:', this.trips.map(t => ({
          id: t.id,
          title: t.title,
          startDate: t.startDate.toISOString(),
          endDate: t.endDate.toISOString(),
          status: t.status,
          plansCount: t.plans?.length || 0
        })));
      } catch (err) {
        this.logger.error(
          'Trips',
          'Erreur chargement voyages démo dynamiques',
          {},
          err instanceof Error ? err : new Error(String(err))
        );
        this.error = this.translate.instant('ERROR.DEMO_LOAD');
      } finally {
        this.isLoading = false;
      }
      return;
    }

    // --- MODE STANDARD / ADMIN : on charge depuis Firestore (inchangé) ---
    try {
      // 1. Vérifier le cache d'abord
      const cacheKey = this.getCacheKey('trips');
      const cachedTrips = await this.getFromCache<Trip[]>(cacheKey, CACHE_CONFIG.TRIPS_MAX_AGE);
      if (cachedTrips) {
        this.trips = cachedTrips.map(t => this.toTrip(t));
        this.processTrips(this.trips);
        this.isLoading = false;
        return;
      }

      // 2. Requête Firestore
      const tripsRef = collection(this.firestore, 'trips');
      const tripsQuery = this.userRole.isAdmin
        ? query(tripsRef)
        : query(tripsRef, where('userId', '==', this.userId));
      const tripsSnapshot = await getDocs(tripsQuery);
      const trips: Trip[] = [];
      for (const docSnap of tripsSnapshot.docs) {
        const tripData = { ...docSnap.data(), id: docSnap.id };
        let trip = this.toTrip(tripData);
        // Charger les plans pour chaque trip
        try {
          const plansQuery = query(collection(this.firestore, 'plans'), where('tripId', '==', trip.id));
          const plansSnapshot = await getDocs(plansQuery);
          trip.plans = plansSnapshot.docs.map(planDoc => this.toPlan({ ...planDoc.data(), id: planDoc.id }));
        } catch (planErr) {
          this.logger.warn('Trips', `Erreur chargement plans pour trip ${trip.id}`, planErr instanceof Error ? planErr : new Error(String(planErr)));
          trip.plans = [];
        }
        trips.push(trip);
      }
      this.trips = trips;
      this.processTrips(this.trips);
      await this.saveToCache(cacheKey, this.trips);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        'Trips',
        'Erreur chargement voyages Firestore',
        { userId: this.userId },
        new Error(errorMessage)
      );
      this.error = this.translate.instant('TRIPS.ERROR_TITLE');
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

    if (now < start) return 'upcoming';
    if (now > end) return 'past';
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
        return 'walk';
      case 'ferry':
        return 'boat';
      default:
        return 'time'; // Icône par défaut pour les plans inconnus
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
   * Retourne un résumé du vol principal du voyage (compagnie, numéro, horaires)
   */
  getMainFlightInfo(trip: Trip): string {
    if (!trip.plans || trip.plans.length === 0) {
      return trip.from && trip.to ? `${trip.from} → ${trip.to}` : this.getTitle(trip.title);
    }
    
    const flights = trip.plans.filter(p => p.type === 'flight');
    if (flights.length === 0) {
      return trip.from && trip.to ? `${trip.from} → ${trip.to}` : this.getTitle(trip.title);
    }
    
    const mainFlight = flights[0];
    if (mainFlight.details && mainFlight.details.route) {
      const departure = mainFlight.details.route.departure?.airport || '';
      const arrival = mainFlight.details.route.arrival?.airport || '';
      return departure && arrival ? `${departure} → ${arrival}` : this.getTitle(mainFlight.title);
    }
    
    return this.getTitle(mainFlight.title);
  }

  /**
   * Retourne le statut du vol principal (plan de type 'flight') pour le badge principal du trip.
   */
  getMainFlightStatus(trip: Trip): 'ongoing' | 'upcoming' | 'past' {
    if (trip.plans && trip.plans.length > 0) {
      const mainFlight = trip.plans.find(p => p.type === 'flight');
      if (mainFlight) {
        const now = new Date();
        const toJsDate = (val: any) => {
          if (!val) return null;
          if (val instanceof Date) return val;
          if (val.seconds) return new Date(val.seconds * 1000);
          if (typeof val.toDate === 'function') return val.toDate();
          return new Date(val);
        };
        const start = toJsDate(mainFlight.startTime) || toJsDate(mainFlight.startDate);
        const end = toJsDate(mainFlight.endTime) || toJsDate(mainFlight.endDate);
        const statut = this.getTripStatus(start, end);
        console.log('[DEBUG getMainFlightStatus]',
          'now:', now.toISOString(), now.toString(),
          'start:', start ? start.toISOString() : start, start ? start.toString() : start,
          'end:', end ? end.toISOString() : end, end ? end.toString() : end,
          'statut:', statut
        );
        return statut;
      }
    }
    return trip.status;
  }

  /**
   * Méthodes helper pour simplifier les expressions dans le template
   */
  getPlansCount(trip: Trip): number {
    return trip.plans?.length || 0;
  }

  getFlightsCount(trip: Trip): number {
    return trip.plans?.filter(p => p.type === 'flight').length || 0;
  }

  getHotelsCount(trip: Trip): number {
    return trip.plans?.filter(p => p.type === 'hotel').length || 0;
  }

  getActivitiesCount(trip: Trip): number {
    return trip.plans?.filter(p => p.type === 'activity').length || 0;
  }

  hasFlights(trip: Trip): boolean {
    return this.getFlightsCount(trip) > 0;
  }

  hasHotels(trip: Trip): boolean {
    return this.getHotelsCount(trip) > 0;
  }

  hasActivities(trip: Trip): boolean {
    return this.getActivitiesCount(trip) > 0;
  }

  getFirstFlightTime(trip: Trip): string {
    if (!this.hasFlights(trip)) return '';
    const firstFlight = trip.plans?.find(p => p.type === 'flight');
    return firstFlight ? this.formatPlanTime(firstFlight.startDate) : '';
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
   * Test direct du service DemoService pour diagnostiquer le problème
   */
  async testDemoService() {
    console.log('🧪 [TRIPS PAGE] Test du service DemoService...');
    
    try {
      // Test 1: Vérifier que le service est injecté
      console.log('🧪 [TRIPS PAGE] Service injecté:', !!this.demoService);
      
      // Test 2: Vérifier le mode démo
      console.log('🧪 [TRIPS PAGE] Mode démo:', this.userRole.isDemo);
      
      // Test 3: Appeler directement getDynamicDemoData
      console.log('🧪 [TRIPS PAGE] Appel direct de getDynamicDemoData...');
      const result = await this.demoService.getDynamicDemoData();
      console.log('🧪 [TRIPS PAGE] Résultat du service:', result);
      
      // Test 4: Afficher les dates des voyages
      if (result && result.length > 0) {
        result.forEach((trip, index) => {
          console.log(`🧪 [TRIPS PAGE] Voyage ${index + 1}:`, {
            id: trip.id,
            title: trip.title,
            startDate: trip.startDate,
            endDate: trip.endDate,
            status: trip.status,
            plansCount: trip.plans?.length || 0
          });
        });
      }
      
      // Afficher un toast de succès
      const toast = await this.toastController.create({
        message: `Test terminé. Vérifiez la console pour les résultats.`,
        duration: 3000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
      
    } catch (error) {
      console.error('🧪 [TRIPS PAGE] Erreur lors du test:', error);
      
      const toast = await this.toastController.create({
        message: `Erreur lors du test: ${error}`,
        duration: 5000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
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
    const start = this.getTripStartDate(trip);
    const end = this.getTripEndDate(trip);
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
   * Retourne la date de début réelle d'un voyage (plus tôt des plans, sinon startDate du trip)
   */
  getTripStartDate(trip: Trip): Date {
    if (trip.plans && trip.plans.length > 0) {
      const min = trip.plans.reduce((min, p) => {
        const d = this.toJsDate(p.startDate);
        return (!min || (d && d < min)) ? d : min;
      }, null as Date | null);
      if (min) return min;
    }
    return this.toJsDate(trip.startDate) || new Date();
  }

  /**
   * Retourne la date de fin réelle d'un voyage (plus tard des plans, sinon endDate du trip)
   */
  getTripEndDate(trip: Trip): Date {
    if (trip.plans && trip.plans.length > 0) {
      const max = trip.plans.reduce((max, p) => {
        const d = this.toJsDate(p.endDate);
        return (!max || (d && d > max)) ? d : max;
      }, null as Date | null);
      if (max) return max;
    }
    return this.toJsDate(trip.endDate) || new Date();
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
    if (!status) return 'À venir';
    const statusLabels: { [key: string]: string } = {
      'upcoming': 'À venir',
      'ongoing': 'En cours',
      'completed': 'Terminé'
    };
    return statusLabels[status] || 'À venir';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ongoing': return 'En cours';
      case 'upcoming': return 'À venir';
      case 'past': return 'Passé';
      default: return status;
    }
  }

  getCountdown(date: Date): string {
    const now = new Date();
    const d = this.toJsDate(date);
    if (!d) return '';
    const diff = d.getTime() - now.getTime();
    const days = Math.round(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `dans ${days} jour${days > 1 ? 's' : ''}`;
    if (days < 0) return `il y a ${-days} jour${days < -1 ? 's' : ''}`;
    return 'aujourd\'hui';
  }

  getChevronLabel(trip: Trip): string {
    const lang = this.getCurrentLang();
    const n = trip.plans?.length || 0;
    if (trip.showDetails) {
      return lang === 'fr' ? 'Masquer les plans' : 'Hide plans';
    }
    if (lang === 'fr') {
      return n === 1 ? 'Voir le plan' : `Voir les ${n} plans`;
    } else {
      return n === 1 ? 'See the plan' : `See the ${n} plans`;
    }
  }

  // --- Helpers pour timeline WAW ---

  isSameDay(dateA: any, dateB: any): boolean {
    if (!dateA || !dateB) return false;
    const a = new Date(dateA);
    const b = new Date(dateB);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  formatPlanDay(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const daysFr = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthsFr = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const lang = this.getCurrentLang();
    if (lang === 'fr') {
      return `${daysFr[d.getDay()]} ${d.getDate()} ${monthsFr[d.getMonth()]}`;
    } else {
      return `${daysEn[d.getDay()]}, ${monthsEn[d.getMonth()]} ${d.getDate()}`;
    }
  }

  formatPlanTime(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    // Forcer le format HH:mm avec padding manuel
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  getPlanIconSVG(type: string): string {
    // SVG inline pour chaque type, extensible
    switch (type) {
      case 'flight':
        return `<svg width='28' height='28' viewBox='0 0 28 28' fill='none'><path d='M2 24l24-10-24-10v7l17 3-17 3v7z' fill='#1bb6b1'/></svg>`;
      case 'hotel':
        return `<svg width='28' height='28' viewBox='0 0 28 28' fill='none'><rect x='4' y='10' width='20' height='10' rx='2' fill='#3a6bff'/><rect x='8' y='14' width='4' height='4' fill='#fff'/></svg>`;
      case 'car':
        return `<svg width='28' height='28' viewBox='0 0 28 28' fill='none'><rect x='4' y='16' width='20' height='6' rx='2' fill='#ff9800'/><circle cx='8' cy='24' r='2' fill='#555'/><circle cx='20' cy='24' r='2' fill='#555'/></svg>`;
      case 'activity':
        return `<svg width='28' height='28' viewBox='0 0 28 28' fill='none'><circle cx='14' cy='14' r='10' fill='#b61b1b'/><rect x='12' y='8' width='4' height='8' fill='#fff'/></svg>`;
      default:
        return `<svg width='28' height='28' viewBox='0 0 28 28' fill='none'><circle cx='14' cy='14' r='12' fill='#e0e7ef'/></svg>`;
    }
  }

  getPlanField(plan: any, field: string): any {
    return plan && plan[field] !== undefined ? plan[field] : undefined;
  }

  // --- Helpers WAW++ ---
  getPlanIconSVGPro(type: string, small: boolean = false): string {
    // Couleur par type
    const size = small ? 22 : 32;
    let color = '#bbb';
    switch (type) {
      case 'flight': color = '#1bb6b1'; break;
      case 'car': color = '#3a6bff'; break;
      case 'hotel': color = '#ff9800'; break;
      case 'activity': color = '#b61b1b'; break;
      case 'walk': color = '#2563eb'; break;
    }
    switch (type) {
      case 'flight':
        return `<svg width='${size}' height='${size}' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M2.5 19l19-7-19-7v5l14 2-14 2v5z'/></svg>`;
      case 'car':
        return `<svg width='${size}' height='${size}' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='11' width='18' height='6' rx='2'/><circle cx='7.5' cy='19' r='1.5'/><circle cx='16.5' cy='19' r='1.5'/></svg>`;
      case 'hotel':
        return `<svg width='${size}' height='${size}' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><rect x='4' y='8' width='16' height='12' rx='2'/><rect x='8' y='12' width='4' height='4'/></svg>`;
      case 'activity':
        return `<svg width='${size}' height='${size}' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><rect x='10' y='7' width='4' height='8'/></svg>`;
      case 'walk':
        return `<svg width='${size}' height='${size}' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='7' r='4'/><path d='M12 11v6m0 0l-3 5m3-5l3 5'/></svg>`;
      default:
        return `<svg width='${size}' height='${size}' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2.5'><circle cx='12' cy='12' r='10'/></svg>`;
    }
  }

  // Helpers pour extraire les détails du vol TripIt-like
  getFlightNumber(plan: any): string {
    return plan.details?.flight?.flight_number || plan.details?.flightNumber || plan.number || '';
  }
  getDepartureAirport(plan: any): string {
    return plan.details?.flight?.departure?.airport || plan.details?.route?.departure?.airport || plan.location || '';
  }
  getArrivalAirport(plan: any): string {
    return plan.details?.flight?.arrival?.airport || plan.details?.route?.arrival?.airport || '';
  }
  getDepartureTime(plan: any): string {
    const t = plan.details?.flight?.departure_time || plan.details?.departure_time || plan.startTime || plan.startDate;
    if (typeof t === 'string' && t.includes(':')) return t;
    return t ? this.formatPlanTime(t) : '';
  }
  getArrivalTime(plan: any): string {
    const t = plan.details?.flight?.arrival_time || plan.details?.arrival_time || plan.endTime || plan.endDate;
    if (typeof t === 'string' && t.includes(':')) return t;
    return t ? this.formatPlanTime(t) : '';
  }

  getPlanDotColor(type: string): string {
    switch (type) {
      case 'flight': return '#e6f7f7';
      case 'car': return '#e6eaff';
      case 'hotel': return '#fffbe6';
      case 'activity': return '#f7e6e6';
      case 'walk': return '#e6f7ff';
      default: return '#e0e7ef';
    }
  }

  getPlanLineColor(type: string): string {
    switch (type) {
      case 'flight': return 'linear-gradient(180deg, #1bb6b1 0%, #3a6bff 100%)';
      case 'car': return 'linear-gradient(180deg, #3a6bff 0%, #1bb6b1 100%)';
      case 'hotel': return 'linear-gradient(180deg, #ff9800 0%, #1bb6b1 100%)';
      case 'activity': return 'linear-gradient(180deg, #b61b1b 0%, #1bb6b1 100%)';
      case 'walk': return 'linear-gradient(180deg, #2563eb 0%, #1bb6b1 100%)';
      default: return 'linear-gradient(180deg, #bbb 0%, #e0e7ef 100%)';
    }
  }

  getPlanStatusIconSVG(status: string): string {
    switch (status) {
      case 'completed':
        return `<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#1bb66f' stroke-width='2'><polyline points='20 6 9 17 4 12'/></svg>`;
      case 'ongoing':
        return `<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#ff9800' stroke-width='2'><circle cx='12' cy='12' r='10'/></svg>`;
      case 'cancelled':
        return `<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#b61b1b' stroke-width='2'><line x1='18' y1='6' x2='6' y2='18'/><line x1='6' y1='6' x2='18' y2='18'/></svg>`;
      default:
        return `<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='#bbb' stroke-width='2'><circle cx='12' cy='12' r='10'/></svg>`;
    }
  }

  getAddPlanSVG(): string {
    return `<svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='#fff' stroke-width='2'><circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='16'/><line x1='8' y1='12' x2='16' y2='12'/></svg>`;
  }

  formatPlanTZ(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const tz = d.toLocaleTimeString('en-us',{timeZoneName:'short'}).split(' ')[2] || '';
    return tz;
  }
} 