import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc, collection, getDocs, deleteDoc, addDoc, query, where, writeBatch } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { getDemoData } from '../demo/demo-data';

// Utilitaire global pour forcer une date à minuit UTC
function toMidnightUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// Centralisation des variables en haut du fichier
const DEMO_EMAIL = environment.demoEmail || 'guestuser@demo.com';
const DEMO_PASSWORD = environment.demoPassword || 'DemoPassword123!';
const DEMO_USER_ID = environment.demoUserId || 'guest-demo';
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

@Injectable({
  providedIn: 'root'
})
export class DemoService {
  private isResetting = false;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) {}

  async activateDemo(lang: string): Promise<boolean> {
    try {
      // Connexion avec les identifiants démo
      await signInWithEmailAndPassword(
        this.auth,
        DEMO_EMAIL,
        DEMO_PASSWORD
      );
      // Stocke le flag demo_mode
      localStorage.setItem('demo_mode', 'true');
      // Création ou mise à jour du profil démo dans Firestore
      const userRef = doc(this.firestore, `users/${DEMO_USER_ID}`);
      await setDoc(userRef, {
        email: DEMO_EMAIL,
        role: 'user',
        isDemo: true,
        language: lang,
        createdAt: new Date(),
        lastLogin: new Date()
      }, { merge: true });
      // Réinitialise les voyages démo
      await this.setupDynamicDemoData();
      return true;
    } catch (error) {
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
    if (value.toDate) { // Gère le Timestamp de Firestore
      return value.toDate();
    }
    return new Date(value); // Gère les strings ISO et les objets Date
  }

  /**
   * Récupère les voyages "modèles" depuis Firestore, puis recalcule dynamiquement
   * toutes les dates en mémoire pour que la démo soit toujours pertinente.
   */
  async getDynamicDemoData(): Promise<any[]> {
    const user = this.auth.currentUser;
    if (!user) return [];

    // 1. Récupérer les données brutes
    const tripsQuery = query(collection(this.firestore, 'trips'), where('userId', '==', user.uid));
    const tripsSnapshot = await getDocs(tripsQuery);
    if (tripsSnapshot.empty) return [];

    const rawTrips: DemoTrip[] = tripsSnapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        title: data['title'],
        startDate: data['startDate'],
        endDate: data['endDate'],
        type: data['type'],
        userId: data['userId'],
        from: data['from'],
        to: data['to'],
        plans: [] // Initialisé à vide, sera peuplé ensuite
      };
    });

    for (const trip of rawTrips) {
      const plansQuery = query(collection(this.firestore, 'plans'), where('tripId', '==', trip.id));
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

    // 2. Trier les voyages en utilisant la conversion de date sécurisée
    rawTrips.sort((a, b) => this.toDate(a.startDate).getTime() - this.toDate(b.startDate).getTime());
    if (rawTrips.length < 3) return rawTrips;
    
    const [pastTpl, ongoingTpl, futureTpl] = rawTrips;

    // 3. Calculer les décalages
    const now = new Date();
    
    const ongoingFlight = ongoingTpl.plans.find(p => p.type === 'flight');
    if (!ongoingFlight) return rawTrips;

    const originalFlightStart = this.toDate(ongoingFlight.startDate);
    const originalFlightEnd = this.toDate(ongoingFlight.endDate);
    const flightDuration = originalFlightEnd.getTime() - originalFlightStart.getTime();
    
    const newFlightStart = new Date(now.getTime() - (flightDuration / 3));
    const ongoingDelta = newFlightStart.getTime() - originalFlightStart.getTime();

    const pastDelta = (new Date(now.getTime() - 30 * MS_IN_DAY)).getTime() - this.toDate(pastTpl.startDate).getTime();
    const futureDelta = (new Date(now.getTime() + 60 * MS_IN_DAY)).getTime() - this.toDate(futureTpl.startDate).getTime();

    // 4. Appliquer les transformations
    const dynamicTrips = [
      this.applyDateShift(pastTpl, pastDelta),
      this.applyDateShift(ongoingTpl, ongoingDelta),
      this.applyDateShift(futureTpl, futureDelta)
    ];

    console.log('[DemoService] Données démo dynamiques générées en mémoire.', dynamicTrips);
    return dynamicTrips;
  }

  /**
   * Applique un décalage temporel (delta) à un voyage et à tous ses plans.
   */
  private applyDateShift(trip: DemoTrip, delta: number): DemoTrip {
    const newTrip = {
      ...trip,
      startDate: new Date(this.toDate(trip.startDate).getTime() + delta),
      endDate: new Date(this.toDate(trip.endDate).getTime() + delta),
      plans: trip.plans.map((plan: DemoPlan) => ({
        ...plan,
        startDate: new Date(this.toDate(plan.startDate).getTime() + delta),
        endDate: new Date(this.toDate(plan.endDate).getTime() + delta),
        startTime: plan.startTime ? new Date(this.toDate(plan.startTime).getTime() + delta) : undefined,
        endTime: plan.endTime ? new Date(this.toDate(plan.endTime).getTime() + delta) : undefined,
      }))
    };

    return newTrip;
  }

  async resetDemoTrips() {
    if (this.isResetting) return;
    this.isResetting = true;
    try {
      // Récupère l'uid réel du user connecté
      const user = this.auth.currentUser;
      if (!user) throw new Error('Utilisateur démo non authentifié');
      const DEMO_UID = user.uid;
      const tripsRef = collection(this.firestore, 'trips');
      const plansRef = collection(this.firestore, 'plans');
      // 1. Supprimer tous les plans du user démo avec createdByDemo: true
      const plansSnap = await getDocs(plansRef);
      const planDeletes: Promise<void>[] = [];
      plansSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data['userId'] === DEMO_UID && data['createdByDemo'] === true) {
          console.log('[DEMO] Suppression plan:', docSnap.id, data['name'] || data['title']);
          planDeletes.push(deleteDoc(doc(this.firestore, 'plans', docSnap.id)));
        }
      });
      await Promise.all(planDeletes);
      // 2. Supprimer tous les trips du user démo avec createdByDemo: true
      const tripsSnap = await getDocs(tripsRef);
      const tripDeletes: Promise<void>[] = [];
      tripsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data['userId'] === DEMO_UID && data['createdByDemo'] === true) {
          console.log('[DEMO] Suppression trip:', docSnap.id, data['name'] || data['title']);
          tripDeletes.push(deleteDoc(doc(this.firestore, 'trips', docSnap.id)));
        }
      });
      await Promise.all(tripDeletes);
      // 3. Génération dynamique du vol Genève-Athènes
      const now = new Date();
      const durationMin = DEFAULT_DURATION_MIN;
      const msTotal = durationMin * 60 * 1000;
      const ms25 = Math.round(msTotal * 0.25);
      const departureUTC = new Date(now.getTime() - ms25);
      const arrivalUTC = new Date(departureUTC.getTime() + msTotal);
      // Trip multilingue
      const trip = {
        title: { fr: 'Vol démo Genève → Athènes', en: 'Demo flight Geneva → Athens' },
        description: { fr: 'Simulation d\'un vol réel entre Genève et Athènes.', en: 'Simulation of a real flight between Geneva and Athens.' },
        startDate: departureUTC.toISOString(),
        endDate: arrivalUTC.toISOString(),
        userId: DEMO_UID,
        type: 'flight',
        from: GVA_AIRPORT.city,
        to: ATH_AIRPORT.city,
        createdByDemo: true
      };
      const tripRef = await addDoc(tripsRef, trip);
      // Plan de vol enrichi
      await addDoc(plansRef, {
        tripId: tripRef.id,
        type: 'flight',
        title: { fr: 'Vol EZS1528 Genève → Athènes', en: 'Flight EZS1528 Geneva → Athens' },
        description: { fr: 'Vol direct easyJet, Airbus A320.', en: 'Direct easyJet flight, Airbus A320.' },
        startDate: departureUTC.toISOString(),
        endDate: arrivalUTC.toISOString(),
        userId: DEMO_UID,
        createdByDemo: true,
        details: {
          flight: {
            flight_number: 'EZS1528',
            airline: 'easyJet',
            aircraft: 'Airbus A320',
            departure: { ...GVA_AIRPORT },
            arrival: { ...ATH_AIRPORT }
          }
        }
      });
    } finally {
      this.isResetting = false;
    }
  }

  /**
   * Prépare les données de démo de manière dynamique.
   * Modifie les dates des voyages et plans existants pour simuler
   * un voyage passé, un en cours et un futur.
   */
  async setupDynamicDemoData() {
    const user = this.auth.currentUser;
    if (!user) {
      console.error('[Demo] Utilisateur non authentifié pour la configuration des données dynamiques.');
      throw new Error('Utilisateur démo non authentifié');
    }

    const tripsQuery = query(collection(this.firestore, 'trips'), where('userId', '==', user.uid));
    const tripsSnapshot = await getDocs(tripsQuery);
    
    const demoTrips = tripsSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as object) }));

    if (demoTrips.length < 3) {
      console.warn(`[Demo] Pas assez de voyages (${demoTrips.length}) pour la démo dynamique. Au moins 3 sont requis.`);
      return;
    }
    
    const now = new Date();
    const batch = writeBatch(this.firestore);

    console.log(`[Demo] Configuration des dates dynamiques basée sur l'heure actuelle : ${now.toISOString()}`);

    // --- 1. Voyage Passé (il y a 3 semaines) ---
    const pastTrip = demoTrips[0];
    const pastStartDate = new Date(now.getTime() - 21 * 24 * 3600 * 1000); // Commence il y a 21 jours
    const pastEndDate = new Date(now.getTime() - 14 * 24 * 3600 * 1000);   // Fini il y a 14 jours
    batch.update(doc(this.firestore, 'trips', pastTrip.id), { startDate: pastStartDate, endDate: pastEndDate });
    console.log(`[Demo] Voyage Passé (${pastTrip.id}) dates: ${pastStartDate.toISOString()} to ${pastEndDate.toISOString()}`);
    await this.updatePlansForTripPreservingTimes(batch, pastTrip.id, pastStartDate, pastEndDate);

    // --- 2. Voyage En Cours (au 1/3 d'un vol de 3h) ---
    const ongoingTrip = demoTrips[1];
    const totalDurationMs = 3 * 60 * 60 * 1000; // 3 heures
    const ongoingStartDate = new Date(now.getTime() - (totalDurationMs / 3)); // Commence il y a 1 heure
    const ongoingEndDate = new Date(now.getTime() + (totalDurationMs * 2 / 3));   // Fini dans 2 heures
    batch.update(doc(this.firestore, 'trips', ongoingTrip.id), { startDate: ongoingStartDate, endDate: ongoingEndDate });
    console.log(`[Demo] Voyage En Cours (${ongoingTrip.id}) dates: ${ongoingStartDate.toISOString()} to ${ongoingEndDate.toISOString()}`);
    await this.updatePlansForTripPreservingTimes(batch, ongoingTrip.id, ongoingStartDate, ongoingEndDate);

    // --- 3. Voyage Futur (dans 3 semaines) ---
    const futureTrip = demoTrips[2];
    const futureStartDate = new Date(now.getTime() + 21 * 24 * 3600 * 1000); // Commence dans 21 jours
    const futureEndDate = new Date(now.getTime() + 28 * 24 * 3600 * 1000);   // Fini dans 28 jours
    batch.update(doc(this.firestore, 'trips', futureTrip.id), { startDate: futureStartDate, endDate: futureEndDate });
    console.log(`[Demo] Voyage Futur (${futureTrip.id}) dates: ${futureStartDate.toISOString()} to ${futureEndDate.toISOString()}`);
    await this.updatePlansForTripPreservingTimes(batch, futureTrip.id, futureStartDate, futureEndDate);
    
    try {
      await batch.commit();
      console.log('[Demo] Données de démo dynamiques mises à jour avec succès.');
    } catch (error) {
      console.error('[Demo] Erreur lors du commit du batch de mise à jour des dates démo.', error);
    }
  }

  /**
   * Met à jour les dates des plans d'un voyage en préservant leurs horaires relatifs.
   * Au lieu d'écraser toutes les heures, on déplace proportionnellement les plans
   * dans la nouvelle fenêtre temporelle du voyage.
   */
  private async updatePlansForTripPreservingTimes(batch: any, tripId: string, tripStartDate: Date, tripEndDate: Date) {
    const plansQuery = query(collection(this.firestore, 'plans'), where('tripId', '==', tripId));
    const plansSnapshot = await getDocs(plansQuery);

    if (plansSnapshot.docs.length === 0) {
      console.log(`[Demo] Aucun plan trouvé pour le voyage ${tripId}`);
      return;
    }

    // Récupérer les plans avec leurs dates originales
    const plans = plansSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    // Trouver les dates min/max des plans pour calculer la fenêtre temporelle originale
    const originalDates = plans
      .map(p => [new Date(p.data['startDate']), new Date(p.data['endDate'])])
      .reduce((acc, val) => acc.concat(val), [] as Date[]);
    
    const originalStart = new Date(Math.min(...originalDates.map((d: Date) => d.getTime())));
    const originalEnd = new Date(Math.max(...originalDates.map((d: Date) => d.getTime())));
    const originalDuration = originalEnd.getTime() - originalStart.getTime();
    const newDuration = tripEndDate.getTime() - tripStartDate.getTime();

    console.log(`[Demo] Voyage ${tripId}:`);
    console.log(`  - Fenêtre originale: ${originalStart.toISOString()} à ${originalEnd.toISOString()} (${Math.round(originalDuration/3600000)}h)`);
    console.log(`  - Fenêtre nouvelle: ${tripStartDate.toISOString()} à ${tripEndDate.toISOString()} (${Math.round(newDuration/3600000)}h)`);

    // Mettre à jour chaque plan en préservant sa position relative dans le temps
    for (const plan of plans) {
      const planStart = new Date(plan.data['startDate']);
      const planEnd = new Date(plan.data['endDate']);
      
      // Calculer la position relative (0.0 = début du voyage, 1.0 = fin du voyage)
      const startRatio = originalDuration > 0 ? (planStart.getTime() - originalStart.getTime()) / originalDuration : 0;
      const endRatio = originalDuration > 0 ? (planEnd.getTime() - originalStart.getTime()) / originalDuration : 1;
      
      // Appliquer ces ratios à la nouvelle fenêtre temporelle
      const newStartDate = new Date(tripStartDate.getTime() + (startRatio * newDuration));
      const newEndDate = new Date(tripStartDate.getTime() + (endRatio * newDuration));
      
      // Préserver l'heure spécifique si c'est un vol
      if (plan.data['type'] === 'flight' && plan.data['details']?.flight) {
        const flightDetails = plan.data['details'].flight;
        
        // Calculer les heures de départ et d'arrivée en préservant les minutes/heures
        const originalDeparture = new Date(flightDetails.departure_time || planStart);
        const originalArrival = new Date(flightDetails.arrival_time || planEnd);
        
        // Extraire les heures/minutes originales
        const departureHours = originalDeparture.getHours();
        const departureMinutes = originalDeparture.getMinutes();
        const arrivalHours = originalArrival.getHours();
        const arrivalMinutes = originalArrival.getMinutes();
        
        // Appliquer ces heures aux nouvelles dates
        newStartDate.setHours(departureHours, departureMinutes, 0, 0);
        newEndDate.setHours(arrivalHours, arrivalMinutes, 0, 0);
        
        // Mettre à jour les détails du vol
        batch.update(doc(this.firestore, 'plans', plan.id), {
          startDate: newStartDate,
          endDate: newEndDate,
          startTime: newStartDate,
          endTime: newEndDate,
          'details.flight.departure_time': newStartDate.toISOString(),
          'details.flight.arrival_time': newEndDate.toISOString()
        });
      } else {
        // Pour les autres types de plans, utiliser les dates calculées
        batch.update(doc(this.firestore, 'plans', plan.id), {
          startDate: newStartDate,
          endDate: newEndDate
        });
      }
      
      console.log(`[Demo] Plan ${plan.id} (${plan.data['name'] || plan.data['title']}):`);
      console.log(`  - Original: ${planStart.toISOString()} à ${planEnd.toISOString()}`);
      console.log(`  - Nouveau: ${newStartDate.toISOString()} à ${newEndDate.toISOString()}`);
    }
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

      // Créer les plans d'abord
      for (const trip of demoData.trips) {
        if (!trip.plans) continue;

        for (const plan of trip.plans) {
          const planRef = doc(collection(this.firestore, 'plans'));
          await setDoc(planRef, {
            ...plan,
            id: planRef.id,
            userId: 'fUBBVpboDeaUjD6w2nz0xKni9mG3',
            createdByDemo: true,
            tripId: trip.id
          });
          console.log(`[Demo] Plan créé: ${planRef.id}`);

          // Stocker l'ID généré
          plan.id = planRef.id;
        }

        // Créer le voyage avec les références aux plans
        const tripRef = doc(collection(this.firestore, 'trips'));
        await setDoc(tripRef, {
          ...trip,
          id: tripRef.id,
          userId: 'fUBBVpboDeaUjD6w2nz0xKni9mG3',
          createdByDemo: true,
          plans: trip.plans.map(p => p.id)
        });
        console.log(`[Demo] Voyage créé: ${tripRef.id}`);
      }

      console.log('[Demo] Données démo initialisées avec succès');
    } catch (error) {
      console.error('[Demo] Erreur initialisation données démo:', error);
      throw error;
    }
  }

  /**
   * Supprime toutes les données de démo de Firestore
   */
  async clearDemoData() {
    try {
      console.log('[Demo] Nettoyage des données démo...');
      const user = this.auth.currentUser;
      if (!user) throw new Error('Utilisateur non authentifié');

      const collections = ['plans', 'trips'];
      const batch = writeBatch(this.firestore);

      for (const coll of collections) {
        const q = query(collection(this.firestore, coll), where('userId', '==', user.uid), where('createdByDemo', '==', true));
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
} 