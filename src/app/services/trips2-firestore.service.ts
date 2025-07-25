import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, updateDoc, collection, getDocs, query, where, writeBatch } from '@angular/fire/firestore';
import { PlanGenerated, TripGenerated } from '../trips2/models/trip-gemini-generated.model';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class Trips2FirestoreService {

  constructor(private firestore: Firestore) {}

  /**
   * Sauvegarde un voyage trips2 avec ses plans enrichis dans Firestore
   */
  async saveTripWithEnrichedPlans(trip: TripGenerated): Promise<void> {
    try {
      console.log(`[Trips2Firestore] Sauvegarde du voyage: ${trip.name}`);
      
      const batch = writeBatch(this.firestore);
      const DEMO_UID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
      
      // 1. Sauvegarder les plans enrichis
      const planIds: string[] = [];
      
      for (const plan of trip.plans || []) {
        const planRef = doc(collection(this.firestore, 'plans'));
        const planData = this.preparePlanForFirestore(plan, trip.id, DEMO_UID);
        
        batch.set(planRef, planData);
        planIds.push(planRef.id);
        
        console.log(`[Trips2Firestore] Plan préparé: ${planRef.id} - ${plan.name}`);
      }
      
      // 2. Sauvegarder le voyage
      const tripRef = doc(collection(this.firestore, 'trips'));
      const tripData = this.prepareTripForFirestore(trip, planIds, DEMO_UID);
      
      batch.set(tripRef, tripData);
      
      // 3. Exécuter le batch
      await batch.commit();
      
      console.log(`[Trips2Firestore] Voyage sauvegardé avec succès: ${tripRef.id}`);
      console.log(`[Trips2Firestore] Plans sauvegardés: ${planIds.length}`);
      
    } catch (error) {
      console.error('[Trips2Firestore] Erreur lors de la sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Met à jour un plan existant avec les informations enrichies
   */
  async updatePlanWithEnrichedDetails(planId: string, enrichedPlan: PlanGenerated, tripId: string): Promise<void> {
    try {
      console.log(`[Trips2Firestore] Mise à jour du plan: ${planId}`);
      
      const planRef = doc(this.firestore, 'plans', planId);
      const planData = this.preparePlanForFirestore(enrichedPlan, tripId, 'fUBBVpboDeaUjD6w2nz0xKni9mG3');
      
      // Supprimer les champs qui ne doivent pas être mis à jour
      delete planData.id;
      delete planData.userId;
      delete planData.tripId;
      delete planData.createdByDemo;
      
      await updateDoc(planRef, planData);
      
      console.log(`[Trips2Firestore] Plan mis à jour avec succès: ${planId}`);
      
    } catch (error) {
      console.error('[Trips2Firestore] Erreur lors de la mise à jour du plan:', error);
      throw error;
    }
  }

  /**
   * Récupère tous les voyages trips2 avec leurs plans enrichis
   */
  getTripsWithEnrichedPlans(): Observable<TripGenerated[]> {
    const DEMO_UID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
    
    return from(this.loadTripsFromFirestore(DEMO_UID)).pipe(
      map(trips => {
        console.log(`[Trips2Firestore] ${trips.length} voyages chargés depuis Firestore`);
        return trips;
      }),
      catchError(error => {
        console.error('[Trips2Firestore] Erreur lors du chargement:', error);
        return of([]);
      })
    );
  }

  /**
   * Supprime tous les voyages trips2 de Firestore
   */
  async clearTrips2Data(): Promise<void> {
    try {
      console.log('[Trips2Firestore] Suppression des données trips2...');
      
      const DEMO_UID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
      const batch = writeBatch(this.firestore);
      
      // Supprimer les plans
      const plansQuery = query(
        collection(this.firestore, 'plans'), 
        where('userId', '==', DEMO_UID), 
        where('createdByDemo', '==', true)
      );
      const plansSnapshot = await getDocs(plansQuery);
      plansSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // Supprimer les voyages
      const tripsQuery = query(
        collection(this.firestore, 'trips'), 
        where('userId', '==', DEMO_UID), 
        where('createdByDemo', '==', true)
      );
      const tripsSnapshot = await getDocs(tripsQuery);
      tripsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
      
      console.log('[Trips2Firestore] Données trips2 supprimées avec succès');
      
    } catch (error) {
      console.error('[Trips2Firestore] Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Prépare un plan pour la sauvegarde dans Firestore
   */
  private preparePlanForFirestore(plan: PlanGenerated, tripId: string, userId: string): any {
    return {
      id: plan.id,
      tripId: tripId,
      userId: userId,
      name: plan.name,
      type: plan.type,
      location: plan.location,
      timezone: plan.timezone,
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: plan.status,
      details: plan.details, // Les informations enrichies
      createdByDemo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Prépare un voyage pour la sauvegarde dans Firestore
   */
  private prepareTripForFirestore(trip: TripGenerated, planIds: string[], userId: string): any {
    return {
      id: trip.id,
      userId: userId,
      name: trip.name,
      description: trip.description,
      image: trip.image,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: trip.status,
      plans: planIds, // Références aux plans
      showDetails: trip.showDetails,
      createdByDemo: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Charge les voyages depuis Firestore
   */
  private async loadTripsFromFirestore(userId: string): Promise<TripGenerated[]> {
    const tripsQuery = query(
      collection(this.firestore, 'trips'), 
      where('userId', '==', userId), 
      where('createdByDemo', '==', true)
    );
    
    const tripsSnapshot = await getDocs(tripsQuery);
    const trips: TripGenerated[] = [];
    
    for (const tripDoc of tripsSnapshot.docs) {
      const tripData = tripDoc.data();
      
      // Charger les plans associés
      const plans: PlanGenerated[] = [];
      if (tripData['plans'] && Array.isArray(tripData['plans'])) {
        for (const planId of tripData['plans']) {
          const planDoc = await getDocs(query(
            collection(this.firestore, 'plans'),
            where('id', '==', planId)
          ));
          
          if (!planDoc.empty) {
            const planData = planDoc.docs[0].data();
            plans.push(this.convertFirestorePlanToGenerated(planData));
          }
        }
      }
      
      trips.push({
        id: tripData['id'],
        name: tripData['name'] || tripData['title'] || '',
        description: tripData['description'] || '',
        image: tripData['image'] || '',
        startDate: tripData['startDate']?.toDate() || new Date(),
        endDate: tripData['endDate']?.toDate() || new Date(),
        status: tripData['status'] || 'upcoming',
        plans: plans,
        showDetails: tripData['showDetails'] || false
      });
    }
    
    return trips;
  }

  /**
   * Convertit un plan Firestore en PlanGenerated
   */
  private convertFirestorePlanToGenerated(planData: any): PlanGenerated {
    return {
      id: planData.id,
      name: planData.name,
      type: planData.type,
      location: planData.location,
      timezone: planData.timezone,
      startDate: planData.startDate?.toDate() || new Date(),
      endDate: planData.endDate?.toDate() || new Date(),
      status: planData.status,
      details: planData.details || undefined
    };
  }
} 