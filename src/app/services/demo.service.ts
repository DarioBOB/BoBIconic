import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc, collection, getDocs, deleteDoc, addDoc, query, where, writeBatch } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { getDemoData } from '../demo/demo-data';
import { LoggerService } from '../services/logger.service';
import { DateTimeService } from '../services/date-time.service';
import * as moment from 'moment-timezone';

// Utilitaire global pour forcer une date à minuit UTC
function toMidnightUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// Utilitaire pour éviter les erreurs linter sur .getTime()
function safeGetTime(d: any): number {
  return d instanceof Date ? d.getTime() : 0;
}

// Centralisation des variables en haut du fichier
const DEMO_EMAIL = 'guestuser@demo.com';
const DEMO_PASSWORD = 'DemoPassword123!';
const DEMO_USER_ID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3'; // UID réel de l'utilisateur démo
const DEFAULT_DURATION_MIN = environment.demoDurationMin || 165; // 2h45
const GVA_AIRPORT = environment.demoGvaAirport || { code: 'GVA', city: 'Genève', name: 'Aéroport de Genève', tz: 'Europe/Zurich', lat: 46.2381, lon: 6.1089 };
const ATH_AIRPORT = environment.demoAthAirport || { code: 'ATH', city: 'Athènes', name: 'Aéroport d\'Athènes Elefthérios-Venizélos', tz: 'Europe/Athens', lat: 37.9364, lon: 23.9475 };
const MS_IN_DAY = 1000 * 60 * 60 * 24;

// Définition des types pour plus de clarté
interface DemoPlan {
  id: string;
  type: string;
  startDate: string | Date;
  endDate: string | Date;
  startTime?: string | Date;
  endTime?: string | Date;
  [key: string]: any;
}

interface DemoTrip {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  plans: DemoPlan[];
  [key: string]: any;
}

// Fonction utilitaire pour normaliser les dates
function toValidDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  // Firestore Timestamp
  if (val._seconds !== undefined && val._nanoseconds !== undefined) {
    const d = new Date(val._seconds * 1000 + Math.floor(val._nanoseconds / 1e6));
    return isNaN(d.getTime()) ? null : d;
  }
  if (val.seconds !== undefined && val.nanoseconds !== undefined) {
    const d = new Date(val.seconds * 1000 + Math.floor(val.nanoseconds / 1e6));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

@Injectable({
  providedIn: 'root'
})
export class DemoService {
  private isResetting = false;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private logger: LoggerService,
    private dateTimeService: DateTimeService
  ) {}

  async activateDemo(lang: string): Promise<boolean> {
    try {
      // Connexion avec les identifiants démo codés en dur
      const cred = await signInWithEmailAndPassword(
        this.auth,
        DEMO_EMAIL,
        DEMO_PASSWORD
      );
      // Log UID et email pour debug
      const user = this.auth.currentUser;
      if (user) {
        console.log(`[Demo] Connecté avec UID: ${user.uid}, email: ${user.email}`);
      } else {
        console.error('[Demo] Aucun utilisateur connecté après signInWithEmailAndPassword');
      }
      // Stocke le flag demo_mode
      localStorage.setItem('demo_mode', 'true');
      // Création ou mise à jour du profil démo dans Firestore
      const demoUid = user?.uid;
      if (!demoUid) {
        console.error('[Demo] Impossible de récupérer l\'UID du compte démo après connexion.');
        throw new Error('UID démo manquant');
      }
      const userRef = doc(this.firestore, `users/${demoUid}`);
      await setDoc(userRef, {
        email: DEMO_EMAIL,
        role: 'demo',
        isDemo: true,
        language: lang,
        createdAt: new Date(),
        lastLogin: new Date()
      }, { merge: true });
      // Réinitialise les voyages démo
      await this.setupDynamicDemoData();
      return true;
    } catch (error: any) {
      const user = this.auth.currentUser;
      const uid = user?.uid;
      const email = user?.email;
      if (error && error.code) {
        console.error(`[Demo] Erreur d'activation (code: ${error.code}) UID: ${uid}, email: ${email}`);
      }
      console.error('Error activating demo mode:', error);
      localStorage.removeItem('demo_mode');
      return false;
    }
  }

  /**
   * Convertit une valeur (Timestamp Firestore, string, etc.) en un objet Date JavaScript.
   */
  private toDate(value: any): Date {
    if (!value) return new Date();
    if (typeof value === 'string') return new Date(value);
    if (typeof value === 'number') return new Date(value);
    if (value instanceof Date) return value;
    if (value._seconds !== undefined && value._nanoseconds !== undefined) {
      // Firestore Timestamp-like object (underscore)
      return new Date(value._seconds * 1000 + Math.floor(value._nanoseconds / 1e6));
    }
    if (value.seconds !== undefined && value.nanoseconds !== undefined) {
      // Firestore Timestamp-like object
      return new Date(value.seconds * 1000 + Math.floor(value.nanoseconds / 1e6));
    }
    if (value.toDate) return value.toDate();
    return new Date(value);
  }

  /**
   * Mapping des aéroports vers les timezones IANA
   */
  private getTimezoneFromAirport(airport: string): string {
    if (!airport) return 'UTC';
    
    const airportUpper = airport.toUpperCase();
    
    // Aéroports suisses
    if (airportUpper.includes('GVA') || airportUpper.includes('GENÈVE') || airportUpper.includes('GENEVA')) {
      return 'Europe/Zurich';
    }
    
    // Aéroports grecs
    if (airportUpper.includes('ATH') || airportUpper.includes('ATHÈNES') || airportUpper.includes('ATHENS')) {
      return 'Europe/Athens';
    }
    if (airportUpper.includes('JTR') || airportUpper.includes('SANTORIN') || airportUpper.includes('SANTORINI')) {
      return 'Europe/Athens';
    }
    
    // Aéroports canadiens
    if (airportUpper.includes('YUL') || airportUpper.includes('MONTRÉAL') || airportUpper.includes('MONTREAL')) {
      return 'America/Montreal';
    }
    if (airportUpper.includes('YQB') || airportUpper.includes('QUÉBEC') || airportUpper.includes('QUEBEC')) {
      return 'America/Montreal';
    }
    if (airportUpper.includes('YGP') || airportUpper.includes('GASPÉ') || airportUpper.includes('GASPE')) {
      return 'America/Montreal';
    }
    
    // Aéroports marocains
    if (airportUpper.includes('RAK') || airportUpper.includes('MARRAKECH')) {
      return 'Africa/Casablanca';
    }
    
    return 'UTC';
  }

  /**
   * Récupère les voyages "modèles" depuis Firestore, puis recalcule dynamiquement
   * toutes les dates en mémoire pour que la démo soit toujours pertinente.
   */
  async getDynamicDemoData(): Promise<any[]> {
    try {
      const user = this.auth.currentUser;
      if (!user) return [];

      // IDs des voyages de démo selon l'export Firebase
      const DEMO_TRIP_IDS = {
        MONTREAL: '8ELij8TbhLUId9EzwpPe',    // Futur
        MARRAKECH: 'EI0DC9Emy8rRAIwRSeFL',   // Passé
        ATHENS: 'ZRH6s0nTMyyPfTDWbHoR'       // En cours
      };

      console.log('📊 [DEMO SERVICE] Chargement des voyages de démo par ID...');

      // 1. Charger directement les 3 voyages par leurs IDs
      const [montrealDoc, marrakechDoc, athensDoc] = await Promise.all([
        getDocs(query(collection(this.firestore, 'trips'), where('__name__', '==', DEMO_TRIP_IDS.MONTREAL))),
        getDocs(query(collection(this.firestore, 'trips'), where('__name__', '==', DEMO_TRIP_IDS.MARRAKECH))),
        getDocs(query(collection(this.firestore, 'trips'), where('__name__', '==', DEMO_TRIP_IDS.ATHENS)))
      ]);

      // 2. Extraire les données des voyages
      const futureTplSrc = montrealDoc.docs[0]?.data();
      const pastTplSrc = marrakechDoc.docs[0]?.data();
      const ongoingTplSrc = athensDoc.docs[0]?.data();

      if (!futureTplSrc || !pastTplSrc || !ongoingTplSrc) {
        console.error('❌ [DEMO SERVICE] Un ou plusieurs voyages de démo manquants');
        return [];
      }

      // 3. Ajouter les IDs aux objets
      futureTplSrc['id'] = DEMO_TRIP_IDS.MONTREAL;
      pastTplSrc['id'] = DEMO_TRIP_IDS.MARRAKECH;
      ongoingTplSrc['id'] = DEMO_TRIP_IDS.ATHENS;

      const rawTrips: DemoTrip[] = [pastTplSrc, ongoingTplSrc, futureTplSrc].map(trip => ({
        id: trip['id'],
        title: trip['title'],
        startDate: trip['startDate'],
        endDate: trip['endDate'],
        type: trip['type'],
        userId: trip['userId'],
        from: trip['from'],
        to: trip['to'],
        status: trip['status'],
        plans: [] // Initialisé à vide, sera peuplé ensuite
      }));

      console.log('📊 [DEMO SERVICE] Voyages bruts récupérés:', rawTrips.length);

      // 4. Charger les plans pour chaque voyage
      for (const trip of rawTrips) {
        const plansQuery = query(
          collection(this.firestore, 'plans'),
          where('tripId', '==', trip.id),
          where('createdByDemo', '==', true)
        );
        const plansSnapshot = await getDocs(plansQuery);
        trip.plans = plansSnapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            title: data['title'],
            description: data['description'],
            type: data['type'],
            startDate: data['startDate'],
            endDate: data['endDate'],
            startTime: data['startTime'],
            endTime: data['endTime'],
            details: data['details'],
            status: data['status']
          };
        });
      }

      console.log('🔍 [DEMO SERVICE] Voyages identifiés par ID:', {
        past: `Voyage passé trouvé (${pastTplSrc['title']?.fr || pastTplSrc['title']})`,
        ongoing: `Voyage en cours trouvé (${ongoingTplSrc['title']?.fr || ongoingTplSrc['title']})`, 
        future: `Voyage futur trouvé (${futureTplSrc['title']?.fr || futureTplSrc['title']})`
      });

      // Clone profond pour éviter toute mutation sur les objets Firestore
      function deepClone(obj: any) {
        return JSON.parse(JSON.stringify(obj));
      }

      const pastTpl = deepClone(pastTplSrc);
      let ongoingTpl = deepClone(ongoingTplSrc);
      const futureTpl = deepClone(futureTplSrc);

      // Log de diagnostic : valeurs brutes avant conversion
      console.log('📅 [DEMO SERVICE] Dates brutes voyage en cours:', { 
        startDate: ongoingTpl.startDate, 
        endDate: ongoingTpl.endDate,
        firstFlightStart: ongoingTpl.plans.find((p: any) => p.type === 'flight')?.startDate
      });

      // Log de diagnostic juste avant conversion en Date
      console.log('🔄 [DEMO SERVICE] Conversion en Date...');
      // Conversion en Date AVANT tout calcul
      [pastTpl, ongoingTpl, futureTpl].forEach(trip => {
        trip.startDate = this.toDate(trip.startDate);
        trip.endDate = this.toDate(trip.endDate);
        if (trip.plans) {
          trip.plans.forEach((plan: any) => {
            plan.startDate = this.toDate(plan.startDate);
            plan.endDate = this.toDate(plan.endDate);
          });
        }
      });
      // Log de vérification des dates ongoingTpl
      console.log('✅ [DEMO SERVICE] Dates après conversion:', { 
        startDate: ongoingTpl.startDate, 
        endDate: ongoingTpl.endDate,
        firstFlightStart: ongoingTpl.plans.find((p: any) => p.type === 'flight')?.startDate
      });

      const now = this.dateTimeService.getCurrentDateTime().date;
      const MS_IN_DAY = 1000 * 60 * 60 * 24;

      console.log('⏰ [DEMO SERVICE] Date actuelle:', now);

      // --- Voyage passé : recalage requirements ---
      console.log('📅 [DEMO SERVICE] Recalcul du voyage passé...');
      const pastTplRecal = await this.recalagePastDemoTrip(pastTpl, now);

      // --- Voyage futur : recalage requirements ---
      console.log('📅 [DEMO SERVICE] Recalcul du voyage futur...');
      const futureTplRecal = await this.recalageFutureDemoTrip(futureTpl, now);

      // --- Voyage en cours : recalage requirements ---
      console.log('🎯 [DEMO SERVICE] Recalcul du voyage en cours...');
      ongoingTpl = await this.recalageOngoingDemoTrip(ongoingTpl, now);

      // Force la conversion en Date pour tous les trips et plans
      [pastTplRecal, ongoingTpl, futureTplRecal].forEach(trip => {
        trip.startDate = new Date(trip.startDate);
        trip.endDate = new Date(trip.endDate);
        if (trip.plans) {
          trip.plans.forEach((plan: any) => {
            plan.startDate = new Date(plan.startDate);
            plan.endDate = new Date(plan.endDate);
          });
        }
      });
      
      // Log ciblé et inratable sur les dates du voyage en cours
      const firstFlightRecal = ongoingTpl.plans.find((p: any) => p.type === 'flight');
      console.log('🎉 [DEMO SERVICE] RECAP FINAL DEMO DATES', {
        now: now.toISOString(),
        ongoingTripStart: ongoingTpl.startDate.toISOString(),
        ongoingTripEnd: ongoingTpl.endDate.toISOString(),
        firstFlightStart: firstFlightRecal?.startDate.toISOString(),
        firstFlightEnd: firstFlightRecal?.endDate.toISOString(),
        departure_time: firstFlightRecal?.details?.flight?.departure_time,
        arrival_time: firstFlightRecal?.details?.flight?.arrival_time
      });
      
      // Retourne les trips dans l'ordre : passé, en cours, à venir
      const result = [pastTplRecal, ongoingTpl, futureTplRecal];
      return result;
    } catch (error) {
      this.logger.error('Demo', 'Erreur lors de la récupération des données de démo dynamiques', { error });
      return [];
    }
  }

  /**
   * Calcule l'offset en ms de chaque plan par rapport à la date de début du trip original
   * Applique cet offset à la nouvelle date de début du trip
   * Retourne un nouveau tableau de plans avec startDate: Date, endDate: Date, et icon: string
   */
  private shiftPlans(trip: any, origBaseDate: any, newBaseDate: Date): any[] {
    if (!trip.plans || !Array.isArray(trip.plans)) {
      return [];
    }

    const origStart = this.toDate(origBaseDate);
    const newStart = this.toDate(newBaseDate);

    return trip.plans.map((plan: any) => {
      const origPlanStart = this.toDate(plan.startDate);
      const origPlanEnd = this.toDate(plan.endDate);

      if (!origPlanStart || !origPlanEnd) {
        return plan;
      }

      const offsetStart = safeGetTime(origPlanStart) - safeGetTime(origStart);
      const offsetEnd = safeGetTime(origPlanEnd) - safeGetTime(origStart);

      const newPlanStart = new Date(safeGetTime(newStart) + offsetStart);
      const newPlanEnd = new Date(safeGetTime(newStart) + offsetEnd);

      const newPlan = {
        ...plan,
        startDate: newPlanStart,
        endDate: newPlanEnd,
        icon: this.getIconNameForPlan(plan.type)
      };

      // Met à jour les horaires de vol au format HH:mm
      if (plan.type === 'flight' && plan.details && plan.details.flight) {
        newPlan.details = {
          ...plan.details,
          flight: {
            ...plan.details.flight,
            departure_time: this.formatTime(newPlanStart),
            arrival_time: this.formatTime(newPlanEnd)
          }
        };
      }

      return newPlan;
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  /**
   * Renvoie l'icône correspondante au type de plan
   */
  private getIconNameForPlan(type: string): string {
    switch (type) {
      case 'flight':
        return 'airplane';
      case 'hotel':
        return 'bed';
      case 'car_rental':
        return 'car';
      case 'activity':
        return 'walk';
      case 'ferry':
        return 'boat';
      default:
        return 'time';
    }
  }

  async resetDemoData() {
    // 1. Supprimer tous les trips/plans démo existants
    await this.clearDemoData();
    // 2. Recréer les voyages/plans démo
    await this.initDemoData();
  }

  /**
   * Prépare les données de démo de manière dynamique.
   * Modifie les dates des voyages et plans existants pour simuler
   * un voyage passé, un en cours et un futur.
   */
  public async setupDynamicDemoData() {
    const user = this.auth.currentUser;
    if (!user) {
      console.error('[Demo] Utilisateur non authentifié pour la configuration des données dynamiques.');
      throw new Error('Utilisateur démo non authentifié');
    }

    const tripsQuery = query(collection(this.firestore, 'trips'), where('createdByDemo', '==', true));
    const tripsSnapshot = await getDocs(tripsQuery);
    
    const demoTrips = tripsSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as object) }));

    if (demoTrips.length < 3) {
      console.warn(`[Demo] Pas assez de voyages (${demoTrips.length}) pour la démo dynamique. Au moins 3 sont requis.`);
      return;
    }
    
    const now = new Date();
    const batch = writeBatch(this.firestore);

    // SUPPRIMÉ : log verbeux

    // --- 1. Voyage Passé (il y a 3 semaines) ---
    const pastTrip = demoTrips[0];
    const pastStartDate = new Date(now.getTime() - 21 * 24 * 3600 * 1000); // Commence il y a 21 jours
    const pastEndDate = new Date(now.getTime() - 14 * 24 * 3600 * 1000);   // Fini il y a 14 jours
    batch.update(doc(this.firestore, 'trips', pastTrip.id), { startDate: pastStartDate, endDate: pastEndDate, createdByDemo: true });
    // SUPPRIMÉ : log verbeux
    await this.updatePlansForTripPreservingTimes(batch, pastTrip.id, pastStartDate, pastEndDate);

    // --- 2. Voyage En Cours (au 1/3 d'un vol réel ou demoDurationMin) ---
    const ongoingTrip = demoTrips[1];
    // Récupérer les plans du voyage en cours
    const plansQuery = query(collection(this.firestore, 'plans'), where('tripId', '==', ongoingTrip.id), where('createdByDemo', '==', true));
    const plansSnapshot = await getDocs(plansQuery);
    const plans = plansSnapshot.docs.map(doc => doc.data());
    // Trouver le premier vol (plan de type 'flight' avec la date la plus basse)
    const flightPlans = plans.filter((p: any) => p.type === 'flight');
    let firstFlight = null;
    if (flightPlans.length > 0) {
      firstFlight = flightPlans.reduce((min: any, p: any) => {
        const d = toValidDate(p.startDate);
        const minDate = toValidDate(min.startDate);
        return (d && minDate && d < minDate) ? p : min;
      }, flightPlans[0]);
    }
    let totalDurationMs = 3 * 60 * 60 * 1000; // fallback 3h
    if (firstFlight) {
      let flightStart = toValidDate(firstFlight.startDate);
      let flightEnd = toValidDate(firstFlight.endDate);
      if (flightStart && flightEnd) {
        totalDurationMs = safeGetTime(flightEnd) - safeGetTime(flightStart);
      } else {
        totalDurationMs = environment.demoDurationMin * 60 * 1000;
      }
    } else {
      totalDurationMs = environment.demoDurationMin * 60 * 1000;
    }
    const ongoingStartDate = new Date(now.getTime() - (totalDurationMs / 3));
    const ongoingEndDate = new Date(now.getTime() + (totalDurationMs * 2 / 3));
    batch.update(doc(this.firestore, 'trips', ongoingTrip.id), { startDate: ongoingStartDate, endDate: ongoingEndDate, createdByDemo: true });
    // SUPPRIMÉ : log verbeux
    await this.updatePlansForTripPreservingTimes(batch, ongoingTrip.id, ongoingStartDate, ongoingEndDate, true);

    // --- 3. Voyage Futur (dans 3 semaines) ---
    const futureTrip = demoTrips[2];
    const futureStartDate = new Date(now.getTime() + 21 * 24 * 3600 * 1000); // Commence dans 21 jours
    const futureEndDate = new Date(now.getTime() + 28 * 24 * 3600 * 1000);   // Fini dans 28 jours
    batch.update(doc(this.firestore, 'trips', futureTrip.id), { startDate: futureStartDate, endDate: futureEndDate, createdByDemo: true });
    // SUPPRIMÉ : log verbeux
    await this.updatePlansForTripPreservingTimes(batch, futureTrip.id, futureStartDate, futureEndDate);
    
    try {
      await batch.commit();
      this.logger.info('Demo', 'Données de démo dynamiques mises à jour');
    } catch (error) {
      this.logger.error('Demo', 'Erreur lors du commit du batch de mise à jour des dates démo', { error });
    }
  }

  /**
   * Met à jour les dates des plans d'un voyage en préservant leurs horaires relatifs.
   * Si isOngoingTrip est true, positionne le premier vol à 1/3 de sa durée et recale les autres plans dynamiquement.
   */
  private async updatePlansForTripPreservingTimes(batch: any, tripId: string, tripStartDate: Date, tripEndDate: Date, isOngoingTrip: boolean = false) {
    // Ne manipuler que les plans démo pour respecter les règles de sécurité
    const plansQuery = query(
      collection(this.firestore, 'plans'),
      where('tripId', '==', tripId),
      where('createdByDemo', '==', true)
    );
    const plansSnapshot = await getDocs(plansQuery);

    if (plansSnapshot.docs.length === 0) {
      this.logger.warn('Demo', `Aucun plan trouvé pour le voyage ${tripId}`);
      return;
    }

    // Récupérer les plans avec leurs dates originales
    const plans = plansSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    // --- NOUVELLE LOGIQUE POUR LE VOYAGE EN COURS ---
    if (isOngoingTrip) {
      // 1. Trouver le premier vol (plan de type 'flight' avec la date la plus basse)
      const flightPlans = plans.filter(p => p.data['type'] === 'flight');
      if (flightPlans.length === 0) {
        console.warn(`[Demo] Aucun vol trouvé pour le voyage en cours ${tripId}`);
        return;
      }
      const firstFlight = flightPlans.length > 0 ? flightPlans.reduce((min: typeof plans[0], p: typeof plans[0]) => {
        const d = toValidDate(p.data['startDate']);
        const minDate = toValidDate(min.data['startDate']);
        return (d && minDate && d < minDate) ? p : min;
      }, flightPlans[0]) as typeof plans[0] : null;
      if (!firstFlight) {
        console.warn(`[Demo] Impossible de trouver le premier vol pour le voyage en cours ${tripId}`);
        return;
      }
      // Durée du vol
      let flightStart = toValidDate(firstFlight.data['startDate']);
      let flightEnd = toValidDate(firstFlight.data['endDate']);
      if (!flightStart || !flightEnd) {
        console.warn(`[Demo] Premier vol sans dates valides pour ${tripId}`);
        return;
      }
      const flightDuration = safeGetTime(flightEnd) - safeGetTime(flightStart);
      // Positionner le vol à 1/3 de sa durée
      const now = new Date();
      const newFlightStart = new Date(now.getTime() - flightDuration / 3);
      const newFlightEnd = new Date(now.getTime() + (flightDuration * 2 / 3));
      // Décalage à appliquer à tous les autres plans
      const delta = safeGetTime(newFlightStart) - safeGetTime(flightStart);
      // Appliquer le recalage à tous les plans
      for (const plan of plans) {
        const planStartDate = toValidDate(plan.data['startDate']);
        const planEndDate = toValidDate(plan.data['endDate']);
        if (!planStartDate || !planEndDate) continue;
        let newStartDate, newEndDate;
        if (plan.id === firstFlight.id) {
          newStartDate = newFlightStart;
          newEndDate = newFlightEnd;
        } else {
          // Garder l'écart d'origine par rapport au premier vol
          const offsetStart = safeGetTime(planStartDate) - (flightStart ? safeGetTime(flightStart) : 0);
          const offsetEnd = safeGetTime(planEndDate) - (flightStart ? safeGetTime(flightStart) : 0);
          newStartDate = new Date(safeGetTime(newFlightStart) + offsetStart);
          newEndDate = new Date(safeGetTime(newFlightStart) + offsetEnd);
        }
        batch.update(doc(this.firestore, 'plans', plan.id), {
          startDate: newStartDate,
          endDate: newEndDate,
          createdByDemo: true
        });
        this.logPlanShift(plan.id, plan.data, flightStart, flightEnd, newFlightStart, newFlightEnd);
      }
      return;
    }
    // --- LOGIQUE PAR DÉFAUT POUR LES AUTRES VOYAGES ---
    // Trouver les dates min/max des plans pour calculer la fenêtre temporelle originale
    const originalDatesRaw = plans
      .map(p => [toValidDate(p.data['startDate']), toValidDate(p.data['endDate'])])
      .reduce((acc, val) => acc.concat(val), [] as (Date|null)[])
      .filter((d): d is Date => !!d);
    const validDates = originalDatesRaw.filter(d => d instanceof Date) as Date[];
    if (validDates.length === 0) {
      console.warn(`[Demo] Aucun plan avec des dates valides pour le voyage ${tripId}`);
      return;
    }
    const validDateTimes = validDates.map(safeGetTime);
    const originalStartDate = new Date(Math.min(...validDateTimes));
    const originalEndDate = new Date(Math.max(...validDateTimes));
    const originalDuration = safeGetTime(originalEndDate) - safeGetTime(originalStartDate);
    const newDuration = safeGetTime(tripEndDate) - safeGetTime(tripStartDate);
    // SUPPRIMÉ : logs verbeux
    // Mettre à jour chaque plan en préservant sa position relative dans le temps
    for (const plan of plans) {
      const planStartDateRaw = toValidDate(plan.data['startDate']);
      const planEndDateRaw = toValidDate(plan.data['endDate']);
      if (!(planStartDateRaw instanceof Date) || !(planEndDateRaw instanceof Date)) {
        console.warn(`[Demo] Plan ${plan.id} a une date invalide:`, plan.data);
        continue;
      }
      const planStartDate = planStartDateRaw;
      const planEndDate = planEndDateRaw;
      const startRatio = originalDuration > 0 ? (safeGetTime(planStartDate) - safeGetTime(originalStartDate)) / originalDuration : 0;
      const endRatio = originalDuration > 0 ? (safeGetTime(planEndDate) - safeGetTime(originalStartDate)) / originalDuration : 1;
      const newStartDate = new Date(tripStartDate.getTime() + (startRatio * newDuration));
      const newEndDate = new Date(tripStartDate.getTime() + (endRatio * newDuration));
      batch.update(doc(this.firestore, 'plans', plan.id), {
        startDate: newStartDate,
        endDate: newEndDate,
        createdByDemo: true
      });
      // SUPPRIMÉ : logs verbeux
    }
  }

  /**
   * Recalage du voyage en cours selon Requirements Démo.txt
   * identifier le premier plan vol (le plus ancien)
   * calculer sa durée = originalEnd – originalStart
   * positionner son nouveau départ à now – durée / 3
   * offset = newFirstFlightStart – originalFirstFlightStart
   * appliquer cet offset à toutes les dates du trip (trip.start, trip.end et plans)
   */
  private async recalageOngoingDemoTrip(trip: any, now: Date): Promise<any> {
    console.log('🔄 [DEMO RECALAGE] Début recalcul voyage en cours');
    console.log('🔄 [DEMO RECALAGE] Date actuelle:', now.toISOString());
    
    // Identifier le premier plan vol (le plus ancien)
    const firstFlight = trip.plans
      .filter((p: any) => p.type === 'flight')
      .sort((a: any, b: any) => this.toDate(a.startDate).getTime() - this.toDate(b.startDate).getTime())[0];
    
    if (!firstFlight) {
      console.warn('⚠️ [DEMO RECALAGE] Aucun vol trouvé dans le voyage en cours');
      return trip;
    }
    
    const origFlightStart = this.toDate(firstFlight.startDate);
    const origFlightEnd   = this.toDate(firstFlight.endDate);
    const flightDuration  = origFlightEnd.getTime() - origFlightStart.getTime();
    
    // Positionner son nouveau départ à now – durée / 3
    const newFlightStart = new Date(now.getTime() - flightDuration / 3);
    const newFlightEnd = new Date(now.getTime() + flightDuration * 2 / 3);
    
    // offset = newFirstFlightStart – originalFirstFlightStart
    const offsetOngoing = newFlightStart.getTime() - origFlightStart.getTime();
    
    console.log('✈️ [DEMO RECALAGE] Calculs du vol principal:', {
      origFlightStart: origFlightStart.toISOString(),
      origFlightEnd: origFlightEnd.toISOString(),
      flightDuration: flightDuration / (1000 * 60 * 60), // en heures
      newFlightStart: newFlightStart.toISOString(),
      newFlightEnd: newFlightEnd.toISOString(),
      offsetOngoing: offsetOngoing / (1000 * 60 * 60), // en heures
      now: now.toISOString(),
      timeElapsed: (now.getTime() - newFlightStart.getTime()) / (1000 * 60 * 60), // temps écoulé en heures
      timeRemaining: (newFlightEnd.getTime() - now.getTime()) / (1000 * 60 * 60) // temps restant en heures
    });
    
    // Appliquer cet offset à toutes les dates du trip (trip.start, trip.end et plans)
    const newTrip = {
      ...trip,
      startDate: new Date(this.toDate(trip.startDate).getTime() + offsetOngoing),
      endDate:   new Date(this.toDate(trip.endDate).getTime() + offsetOngoing),
      plans: await Promise.all(trip.plans.map(async (plan: any) => {
        const newPlanStart = new Date(this.toDate(plan.startDate).getTime() + offsetOngoing);
        const newPlanEnd   = new Date(this.toDate(plan.endDate).getTime() + offsetOngoing);
        const newPlan = {
          ...plan,
          startDate: newPlanStart,
          endDate:   newPlanEnd,
          icon: this.getIconNameForPlan(plan.type)
        };
        
        if (plan.type === 'flight' && plan.details && plan.details.flight) {
          // Déterminer les timezones basées sur les aéroports
          const departureAirport = plan.details.flight.departure?.airport;
          const arrivalAirport = plan.details.flight.arrival?.airport;
          
          const departureTimezone = this.getTimezoneFromAirport(departureAirport);
          const arrivalTimezone = this.getTimezoneFromAirport(arrivalAirport);
          
          // Formater les heures avec timezone
          const [departureTime, arrivalTime] = await Promise.all([
            this.formatTimeWithTimezone(newPlanStart, departureTimezone),
            this.formatTimeWithTimezone(newPlanEnd, arrivalTimezone)
          ]);
          
          newPlan.details = {
            ...plan.details,
            flight: {
              ...plan.details.flight,
              departure_time: departureTime.time,
              arrival_time: arrivalTime.time
            }
          };
          
          // Ajouter les propriétés d'affichage avec timezone
          newPlan.departureTimeAffiche = departureTime.time;
          newPlan.arrivalTimeAffiche = arrivalTime.time;
          newPlan.departureTzAbbr = departureTime.abbr;
          newPlan.arrivalTzAbbr = arrivalTime.abbr;
        }
        
        return newPlan;
      }))
    };
    
    // Log pour debug
    const recalculatedFirstFlight = newTrip.plans.find((p: any) => p.type === 'flight');
    console.log('✅ [DEMO RECALAGE] Résultat du recalcul voyage en cours:', {
      newTripStart: newTrip.startDate.toISOString(),
      newTripEnd: newTrip.endDate.toISOString(),
      recalculatedFirstFlightStart: recalculatedFirstFlight?.startDate.toISOString(),
      recalculatedFirstFlightEnd: recalculatedFirstFlight?.endDate.toISOString(),
      departure_time: recalculatedFirstFlight?.details?.flight?.departure_time,
      arrival_time: recalculatedFirstFlight?.details?.flight?.arrival_time,
      departureTzAbbr: recalculatedFirstFlight?.departureTzAbbr,
      arrivalTzAbbr: recalculatedFirstFlight?.arrivalTzAbbr,
      isFlightInProgress: now >= recalculatedFirstFlight?.startDate && now <= recalculatedFirstFlight?.endDate
    });
    
    return newTrip;
  }

  /**
   * Recalage du voyage passé selon Requirements Démo.txt
   * début = maintenant – 37 jours
   * fin   = maintenant – 30 jours
   */
  private async recalagePastDemoTrip(trip: any, now: Date): Promise<any> {
    console.log('📅 [DEMO RECALAGE] Début recalcul voyage passé');
    console.log('📅 [DEMO RECALAGE] Date actuelle:', now.toISOString());

    const MS_IN_DAY = 1000 * 60 * 60 * 24;
    
    // Calcul des nouvelles dates selon les requirements
    const newStart = new Date(now.getTime() - 37 * MS_IN_DAY);
    const newEnd = new Date(now.getTime() - 30 * MS_IN_DAY);
    
    // Calcul de l'offset pour décaler tous les plans
    const originalStart = this.toDate(trip.startDate);
    const offset = newStart.getTime() - originalStart.getTime();

    console.log('📅 [DEMO RECALAGE] Calculs du voyage passé:', {
      originalStart: originalStart.toISOString(),
      originalEnd: this.toDate(trip.endDate).toISOString(),
      newStart: newStart.toISOString(),
      newEnd: newEnd.toISOString(),
      offset: offset / (1000 * 60 * 60 * 24), // en jours
      now: now.toISOString()
    });

    const newTrip = {
      ...trip,
      startDate: newStart,
      endDate: newEnd,
      plans: await Promise.all(trip.plans.map(async (plan: any) => {
        const newPlanStart = new Date(this.toDate(plan.startDate).getTime() + offset);
        const newPlanEnd = new Date(this.toDate(plan.endDate).getTime() + offset);
        const newPlan = {
          ...plan,
          startDate: newPlanStart,
          endDate: newPlanEnd,
          icon: this.getIconNameForPlan(plan.type)
        };
        
        if (plan.type === 'flight' && plan.details && plan.details.flight) {
          // Déterminer les timezones basées sur les aéroports
          const departureAirport = plan.details.flight.departure?.airport;
          const arrivalAirport = plan.details.flight.arrival?.airport;
          
          const departureTimezone = this.getTimezoneFromAirport(departureAirport);
          const arrivalTimezone = this.getTimezoneFromAirport(arrivalAirport);
          
          // Formater les heures avec timezone
          const [departureTime, arrivalTime] = await Promise.all([
            this.formatTimeWithTimezone(newPlanStart, departureTimezone),
            this.formatTimeWithTimezone(newPlanEnd, arrivalTimezone)
          ]);
          
          newPlan.details = {
            ...plan.details,
            flight: {
              ...plan.details.flight,
              departure_time: departureTime.time,
              arrival_time: arrivalTime.time
            }
          };
          
          // Ajouter les propriétés d'affichage avec timezone
          newPlan.departureTimeAffiche = departureTime.time;
          newPlan.arrivalTimeAffiche = arrivalTime.time;
          newPlan.departureTzAbbr = departureTime.abbr;
          newPlan.arrivalTzAbbr = arrivalTime.abbr;
        }
        
        return newPlan;
      }))
    };

    // Log pour debug
    const recalculatedFirstFlight = newTrip.plans.find((p: any) => p.type === 'flight');
    console.log('✅ [DEMO RECALAGE] Résultat du recalcul voyage passé:', {
      newTripStart: newTrip.startDate.toISOString(),
      newTripEnd: newTrip.endDate.toISOString(),
      recalculatedFirstFlightStart: recalculatedFirstFlight?.startDate.toISOString(),
      recalculatedFirstFlightEnd: recalculatedFirstFlight?.endDate.toISOString(),
      departure_time: recalculatedFirstFlight?.details?.flight?.departure_time,
      arrival_time: recalculatedFirstFlight?.details?.flight?.arrival_time,
      departureTzAbbr: recalculatedFirstFlight?.departureTzAbbr,
      arrivalTzAbbr: recalculatedFirstFlight?.arrivalTzAbbr
    });

    return newTrip;
  }

  /**
   * Recalage du voyage futur selon Requirements Démo.txt
   * début = maintenant + 60 jours
   * fin   = maintenant + 67 jours
   */
  private async recalageFutureDemoTrip(trip: any, now: Date): Promise<any> {
    console.log('📅 [DEMO RECALAGE] Début recalcul voyage futur');
    console.log('📅 [DEMO RECALAGE] Date actuelle:', now.toISOString());

    const MS_IN_DAY = 1000 * 60 * 60 * 24;
    
    // Calcul des nouvelles dates selon les requirements
    const newStart = new Date(now.getTime() + 60 * MS_IN_DAY);
    const newEnd = new Date(now.getTime() + 67 * MS_IN_DAY);
    
    // Calcul de l'offset pour décaler tous les plans
    const originalStart = this.toDate(trip.startDate);
    const offset = newStart.getTime() - originalStart.getTime();

    console.log('📅 [DEMO RECALAGE] Calculs du voyage futur:', {
      originalStart: originalStart.toISOString(),
      originalEnd: this.toDate(trip.endDate).toISOString(),
      newStart: newStart.toISOString(),
      newEnd: newEnd.toISOString(),
      offset: offset / (1000 * 60 * 60 * 24), // en jours
      now: now.toISOString()
    });

    const newTrip = {
      ...trip,
      startDate: newStart,
      endDate: newEnd,
      plans: await Promise.all(trip.plans.map(async (plan: any) => {
        const newPlanStart = new Date(this.toDate(plan.startDate).getTime() + offset);
        const newPlanEnd = new Date(this.toDate(plan.endDate).getTime() + offset);
        const newPlan = {
          ...plan,
          startDate: newPlanStart,
          endDate: newPlanEnd,
          icon: this.getIconNameForPlan(plan.type)
        };
        
        if (plan.type === 'flight' && plan.details && plan.details.flight) {
          // Déterminer les timezones basées sur les aéroports
          const departureAirport = plan.details.flight.departure?.airport;
          const arrivalAirport = plan.details.flight.arrival?.airport;
          
          const departureTimezone = this.getTimezoneFromAirport(departureAirport);
          const arrivalTimezone = this.getTimezoneFromAirport(arrivalAirport);
          
          // Formater les heures avec timezone
          const [departureTime, arrivalTime] = await Promise.all([
            this.formatTimeWithTimezone(newPlanStart, departureTimezone),
            this.formatTimeWithTimezone(newPlanEnd, arrivalTimezone)
          ]);
          
          newPlan.details = {
            ...plan.details,
            flight: {
              ...plan.details.flight,
              departure_time: departureTime.time,
              arrival_time: arrivalTime.time
            }
          };
          
          // Ajouter les propriétés d'affichage avec timezone
          newPlan.departureTimeAffiche = departureTime.time;
          newPlan.arrivalTimeAffiche = arrivalTime.time;
          newPlan.departureTzAbbr = departureTime.abbr;
          newPlan.arrivalTzAbbr = arrivalTime.abbr;
        }
        
        return newPlan;
      }))
    };

    // Log pour debug
    const recalculatedFirstFlight = newTrip.plans.find((p: any) => p.type === 'flight');
    console.log('✅ [DEMO RECALAGE] Résultat du recalcul:', {
      newTripStart: newTrip.startDate.toISOString(),
      newTripEnd: newTrip.endDate.toISOString(),
      recalculatedFirstFlightStart: recalculatedFirstFlight?.startDate.toISOString(),
      recalculatedFirstFlightEnd: recalculatedFirstFlight?.endDate.toISOString(),
      departure_time: recalculatedFirstFlight?.details?.flight?.departure_time,
      arrival_time: recalculatedFirstFlight?.details?.flight?.arrival_time,
      departureTzAbbr: recalculatedFirstFlight?.departureTzAbbr,
      arrivalTzAbbr: recalculatedFirstFlight?.arrivalTzAbbr,
      isFlightInProgress: now >= recalculatedFirstFlight?.startDate && now <= recalculatedFirstFlight?.endDate
    });

    return newTrip;
  }

  deactivateDemo() {
    localStorage.removeItem('demo_mode');
  }

  isDemoMode(): boolean {
    return localStorage.getItem('demo_mode') === 'true';
  }

  /**
   * Initialise ou réinitialise les données de démo dans Firestore
   */
  async initDemoData() {
    try {
      console.log('[Demo] Début initialisation données démo');
      const demoData = getDemoData();
      // Utiliser l'UID démo attendu, pas celui de l'utilisateur connecté
      const DEMO_UID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
      // Créer les plans d'abord
      for (const trip of demoData.trips) {
        if (!trip.plans) continue;
        for (const plan of trip.plans) {
          const planRef = doc(collection(this.firestore, 'plans'));
          const planData = { ...plan };
          if ('userId' in planData) delete (planData as any).userId;
          if ('createdByDemo' in planData) delete (planData as any).createdByDemo;
          if ('tripId' in planData) delete (planData as any).tripId;
          if ('id' in planData) delete (planData as any).id;
          if (plan.type === 'flight' && planData.details && planData.details.from && planData.details.to && planData.details.company) {
            const callsign = this.generateCallsign(planData.details.from, planData.details.to);
            planData.details = { ...planData.details, callsign };
          }
          await setDoc(planRef, {
            ...planData,
            id: planRef.id,
            userId: DEMO_UID,
            createdByDemo: true,
            tripId: trip.id
          });
          console.log(`[Demo] Plan créé: ${planRef.id} (userId=${DEMO_UID})`);
          plan.id = planRef.id;
        }
        // Ajout du callsign du vol principal au trip
        let mainCallsign = undefined;
        if (trip.plans && trip.plans.length > 0) {
          const mainFlight = trip.plans.find(p => p.type === 'flight' && p.details && p.details.callsign);
          if (mainFlight) {
            mainCallsign = mainFlight.details.callsign;
          }
        }
        // Créer le voyage avec les références aux plans
        const tripRef = doc(collection(this.firestore, 'trips'));
        await setDoc(tripRef, {
          ...trip,
          id: tripRef.id,
          userId: DEMO_UID,
          createdByDemo: true,
          plans: trip.plans.map(p => p.id),
          callsign: mainCallsign
        });
        console.log(`[Demo] Voyage créé: ${tripRef.id} (userId=${DEMO_UID})`);
      }
      console.log('[Demo] Données démo initialisées avec succès');
    } catch (error) {
      console.error('[Demo] Erreur initialisation données démo:', error);
      throw error;
    }
  }

  /**
   * Génère un callsign fictif pour un vol démo
   */
  private generateCallsign(from?: string, to?: string): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const airline = ['AF', 'EZ', 'AC', 'LX', 'BA', 'LH', 'KL', 'UA', 'DL', 'AA'][Math.floor(Math.random()*10)];
    const num = Math.floor(100 + Math.random()*900);
    let suffix = '';
    if (from && to) {
      suffix = '-' + from.substring(0,2).toUpperCase() + to.substring(0,2).toUpperCase();
    }
    return `${airline}${num}${suffix}`;
  }

  /**
   * Supprime toutes les données de démo de Firestore
   */
  async clearDemoData() {
    try {
      console.log('[Demo] Nettoyage des données démo...');
      // Utiliser l'UID démo attendu, pas seulement l'utilisateur connecté
      const DEMO_UID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
      const collections = ['plans', 'trips'];
      const batch = writeBatch(this.firestore);
      for (const coll of collections) {
        const q = query(collection(this.firestore, coll), where('userId', '==', DEMO_UID), where('createdByDemo', '==', true));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
      }
      await batch.commit();
      console.log('[Demo] Données de démo supprimées de Firestore.');
    } catch (error) {
      console.error('[Demo] Erreur lors du nettoyage des données démo:', error);
      throw error;
    }
  }

  /**
   * Recharge complètement les voyages démo en supprimant et recréant toutes les données
   */
  async reloadDemoTrips() {
    try {
      console.log('[Demo] Début rechargement des voyages démo');
      
      // 1. Supprimer toutes les données démo existantes
      await this.clearDemoData();
      
      // 2. Recréer les données démo fraîches
      await this.initDemoData();
      
      // 3. Configurer les dates dynamiques
      await this.setupDynamicDemoData();
      
      console.log('[Demo] Voyages démo rechargés avec succès');
    } catch (error) {
      console.error('[Demo] Erreur lors du rechargement des voyages démo:', error);
      throw error;
    }
  }

  async updateDemoPlan(planId: string, update: any) {
    // Ajoute systématiquement le flag pour respecter les règles
    await setDoc(doc(this.firestore, 'plans', planId), {
      ...update,
      createdByDemo: true
    }, { merge: true });
  }

  async updateDemoTrip(tripId: string, update: any) {
    await setDoc(doc(this.firestore, 'trips', tripId), {
      ...update,
      createdByDemo: true
    }, { merge: true });
  }

  private logPlanShift(planId: string, plan: any, originalStart: Date, originalEnd: Date, newStart: Date, newEnd: Date): void {
    // SUPPRIMÉ : logs trop verbeux qui polluent la console
    // console.log(`[Demo] Plan ${planId} (${plan.title?.fr || plan.title?.en || 'Sans titre'}):`);
    // console.log(`  - Original: ${originalStart.toISOString()} à ${originalEnd.toISOString()}`);
    // console.log(`  - Nouveau: ${newStart.toISOString()} à ${newEnd.toISOString()}`);
  }

  /**
   * Formate une date avec l'abréviation du fuseau horaire
   * Utilise moment-timezone en premier, puis fallback vers OpenAI si nécessaire
   */
  private async formatTimeWithTimezone(date: Date, timezone: string): Promise<{ time: string, abbr: string }> {
    try {
      // Essayer avec moment-timezone d'abord
      const momentDate = moment.tz(date, timezone);
      if (momentDate.isValid()) {
        const time = momentDate.format('HH:mm');
        const abbr = momentDate.format('z');
        return { time, abbr };
      }
    } catch (error) {
      console.warn(`⚠️ [DEMO SERVICE] moment-timezone échoué pour ${timezone}:`, error);
    }

    // Fallback vers OpenAI si moment-timezone échoue
    try {
      const abbr = await this.getTimezoneAbbreviationFromOpenAI(timezone);
      const time = date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: timezone 
      });
      return { time, abbr };
    } catch (error) {
      console.error(`❌ [DEMO SERVICE] OpenAI fallback échoué pour ${timezone}:`, error);
      // Fallback final
      const time = date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      return { time, abbr: 'UTC' };
    }
  }

  /**
   * Récupère l'abréviation d'un fuseau horaire via OpenAI
   */
  private async getTimezoneAbbreviationFromOpenAI(timezone: string): Promise<string> {
    // Vérifier si la clé OpenAI est disponible
    if (!environment.openaiApiKey) {
      console.warn('⚠️ [DEMO SERVICE] Clé OpenAI non disponible');
      return 'UTC';
    }

    try {
      // Import dynamique d'OpenAI pour éviter les problèmes de build
      const OpenAI = await import('openai');
      const openai = new OpenAI.default({
        apiKey: environment.openaiApiKey,
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'Tu es un service de conversion de fuseaux. Réponds uniquement avec l\'abréviation officielle du fuseau horaire (ex: CET, EST, PST).' },
          { role: 'user', content: `Donne-moi l'abréviation officielle pour le fuseau "${timezone}".` }
        ],
        max_tokens: 10,
        temperature: 0
      });

      const abbr = response.choices[0]?.message?.content?.trim() || 'UTC';
      console.log(`✅ [DEMO SERVICE] OpenAI timezone ${timezone} → ${abbr}`);
      return abbr;
    } catch (error) {
      console.error('❌ [DEMO SERVICE] Erreur OpenAI:', error);
      return 'UTC';
    }
  }
}