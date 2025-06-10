import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private firestore: Firestore) {}

  async getAllUsersWithTripsAndPlans() {
    const users: any[] = [];
    const usersSnap = await getDocs(collection(this.firestore, 'users'));
    
    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();
      const userId = userDoc.id;
      
      // Récupérer les voyages de l'utilisateur
      const tripsSnap = await getDocs(
        query(collection(this.firestore, 'trips'), where('userId', '==', userId))
      );
      
      const trips: any[] = [];
      for (const tripDoc of tripsSnap.docs) {
        const trip = tripDoc.data();
        
        // Récupérer les plans du voyage
        const plansSnap = await getDocs(
          query(collection(this.firestore, 'plans'), where('tripId', '==', tripDoc.id))
        );
        
        const plans = plansSnap.docs.map(planDoc => ({
          id: planDoc.id,
          ...planDoc.data()
        }));
        
        trips.push({
          id: tripDoc.id,
          ...trip,
          plans
        });
      }
      
      users.push({
        id: userId,
        ...user,
        trips
      });
    }
    
    return users;
  }
} 