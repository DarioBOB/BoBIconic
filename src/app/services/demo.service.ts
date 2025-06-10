import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc, collection, getDocs, deleteDoc, addDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

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
      await this.resetDemoTrips();
      return true;
    } catch (error) {
      console.error('Error activating demo mode:', error);
      localStorage.removeItem('demo_mode');
      return false;
    }
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

  deactivateDemo() {
    localStorage.removeItem('demo_mode');
  }

  isDemoMode(): boolean {
    return localStorage.getItem('demo_mode') === 'true';
  }
} 