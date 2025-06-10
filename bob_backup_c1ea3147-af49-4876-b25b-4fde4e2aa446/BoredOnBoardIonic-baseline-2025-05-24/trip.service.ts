import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, orderBy, getDocs } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, map } from 'rxjs';
import { PlanEnrichmentService } from './plan-enrichment.service';

export interface Trip {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'ongoing' | 'past';
  userId: string;
  createdByDemo?: boolean;
  // Autres propriétés à ajouter selon les besoins
}

@Injectable({
  providedIn: 'root'
})
export class TripService {
  public firestore: Firestore;

  constructor(
    firestore: Firestore,
    private auth: Auth,
    private planEnrichmentService: PlanEnrichmentService
  ) {
    this.firestore = firestore;
  }

  async getTrips(): Promise<{ upcoming: Trip[], ongoing: Trip[], past: Trip[] }> {
    const userId = this.auth.currentUser?.uid;
    const userEmail = this.auth.currentUser?.email;
    console.log('[TripService] UID utilisé pour la requête Firestore :', userId, '| Email :', userEmail);
    if (userEmail === 'guestuser@demo.com') {
      console.log('[TripService] MODE DEMO ACTIF - UID attendu pour démo : fUBBVpboDeaUjD6w2nz0xKni9mG3');
    }
    if (!userId) return { upcoming: [], ongoing: [], past: [] };

    try {
      const tripsRef = collection(this.firestore, 'trips');
      const q = query(
        tripsRef,
        where('userId', '==', userId),
        orderBy('startDate', 'asc')
      );

      const snapshot = await getDocs(q);
      console.log('[TripService] Raw snapshot:', snapshot.docs.map(d => d.data()));
      const trips = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data['startDate']?.toDate ? data['startDate'].toDate() : data['startDate'],
          endDate: data['endDate']?.toDate ? data['endDate'].toDate() : data['endDate']
        };
      }) as Trip[];
      trips.forEach(trip => console.log('[TripService] Trip:', trip.id, 'userId:', trip.userId));
      console.log('[TripService] Voyages récupérés :', trips.length, trips);

      // Filtrage strict démo/réel/admin
      let filteredTrips = trips;
      // On considère qu'un admin a le champ role === 'admin' dans le user Firestore
      let isAdmin = false;
      try {
        const userDoc = await getDocs(query(collection(this.firestore, 'users'), where('__name__', '==', userId)));
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          isAdmin = userData['role'] === 'admin';
        }
      } catch (e) {
        // ignore
      }
      if (!isAdmin) {
        if (userEmail === 'guestuser@demo.com') {
          filteredTrips = trips.filter(trip => trip['createdByDemo'] === true);
        } else {
          filteredTrips = trips.filter(trip => trip['createdByDemo'] !== true);
        }
      }

      const now = new Date();
      return {
        upcoming: filteredTrips.filter(trip => new Date(trip.startDate) > now),
        ongoing: filteredTrips.filter(trip => 
          new Date(trip.startDate) <= now && new Date(trip.endDate) >= now
        ),
        past: filteredTrips.filter(trip => new Date(trip.endDate) < now)
      };
    } catch (error) {
      // On log l'erreur pour debug
      console.error('Erreur Firestore getTrips:', error);
      // On relance l'erreur pour affichage côté UI
      throw new Error('FIRESTORE_ERROR');
    }
  }

  async getPlansForTrip(tripId: string): Promise<any[]> {
    try {
      const userId = this.auth.currentUser?.uid;
      const userEmail = this.auth.currentUser?.email;
      console.log('[DEBUG] getPlansForTrip - userId:', userId, '| Email :', userEmail);
      if (userEmail === 'guestuser@demo.com') {
        console.log('[DEBUG] MODE DEMO ACTIF - UID attendu pour démo : fUBBVpboDeaUjD6w2nz0xKni9mG3');
      }
      console.log('[DEBUG] getPlansForTrip - tripId:', tripId);
      
      const plansRef = collection(this.firestore, 'plans');
      const q = query(
        plansRef,
        where('tripId', '==', tripId),
        orderBy('startDate', 'asc')
      );

      let snapshot = await getDocs(q);
      console.log('[DEBUG] getPlansForTrip - Raw snapshot:', snapshot.docs.map(d => d.data()));
      let plans = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data['startDate']?.toDate ? data['startDate'].toDate() : data['startDate'],
          endDate: data['endDate']?.toDate ? data['endDate'].toDate() : data['endDate'],
          createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : data['createdAt'],
          updatedAt: data['updatedAt']?.toDate ? data['updatedAt'].toDate() : data['updatedAt'],
        };
      });
      // Fallback : si aucun plan trouvé, mais le trip contient un champ plans (array d'IDs), on va les chercher un par un
      if (plans.length === 0) {
        const tripDocRef = collection(this.firestore, 'trips');
        const tripSnapshot = await getDocs(query(tripDocRef, where('__name__', '==', tripId)));
        if (!tripSnapshot.empty) {
          const tripData = tripSnapshot.docs[0].data();
          if (tripData['plans'] && Array.isArray(tripData['plans']) && tripData['plans'].length > 0) {
            const planDocs = [];
            for (const planId of tripData['plans']) {
              const planDocSnap = await getDocs(query(plansRef, where('__name__', '==', planId)));
              if (!planDocSnap.empty) {
                const doc = planDocSnap.docs[0];
                const data = doc.data();
                planDocs.push({
                  id: doc.id,
                  ...data,
                  startDate: data['startDate']?.toDate ? data['startDate'].toDate() : data['startDate'],
                  endDate: data['endDate']?.toDate ? data['endDate'].toDate() : data['endDate'],
                  createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : data['createdAt'],
                  updatedAt: data['updatedAt']?.toDate ? data['updatedAt'].toDate() : data['updatedAt'],
                });
              }
            }
            plans = planDocs;
            console.log('[DEBUG] Fallback plans loaded by IDs:', plans);
          }
        }
      }
      console.log('[DEBUG] getPlansForTrip - Processed plans:', plans);
      return plans;
    } catch (error) {
      console.error('Erreur Firestore getPlansForTrip:', error);
      throw new Error('FIRESTORE_ERROR');
    }
  }
} 