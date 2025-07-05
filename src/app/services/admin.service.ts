import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';

interface User {
  id: string;
  email?: string;
  role?: string;
  displayName?: string;
  tripCount?: number;
  trips?: Trip[];
}

interface Trip {
  id: string;
  userId?: string;
  title?: any;
  startDate?: any;
  endDate?: any;
  plans?: Plan[];
}

interface Plan {
  id: string;
  tripId?: string;
  title?: any;
  type?: string;
  startDate?: any;
  endDate?: any;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private firestore: Firestore) {}

  async getAllUsersWithTripsAndPlans() {
    const users: User[] = [];
    const usersSnap = await getDocs(collection(this.firestore, 'users'));
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const user: User = { id: userId, ...userData };
      
      // Récupérer les voyages de l'utilisateur
      const tripsSnap = await getDocs(query(collection(this.firestore, 'trips'), where('userId', '==', userId)));
      const trips: Trip[] = [];
      for (const tripDoc of tripsSnap.docs) {
        const tripData = tripDoc.data();
        const trip: Trip = { id: tripDoc.id, ...tripData };
        
        // Récupérer les plans du voyage
        const plansSnap = await getDocs(query(collection(this.firestore, 'plans'), where('tripId', '==', tripDoc.id)));
        const plans = plansSnap.docs.map(planDoc => ({ id: planDoc.id, ...planDoc.data() } as Plan));
        trip.plans = plans;
        trips.push(trip);
      }
      user.trips = trips;
      users.push(user);
    }
    return users;
  }

  async getAllUsersWithTripCount(): Promise<User[]> {
    // Charger tous les users
    const usersSnapshot = await getDocs(collection(this.firestore, 'users'));
    const users: User[] = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    
    // Charger tous les trips
    const tripsSnapshot = await getDocs(collection(this.firestore, 'trips'));
    const trips: Trip[] = tripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));
    
    // Compter les voyages par user
    for (const user of users) {
      user.tripCount = trips.filter(trip => trip.userId === user.id).length;
    }
    return users;
  }

  async getUsersWithTripsAndPlans(): Promise<User[]> {
    // Charger tous les users (triés par email)
    const usersSnapshot = await getDocs(collection(this.firestore, 'users'));
    let users: User[] = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    users = users.sort((a, b) => (a.email || a.id).localeCompare(b.email || b.id));

    // Charger tous les trips
    const tripsSnapshot = await getDocs(collection(this.firestore, 'trips'));
    const trips: Trip[] = tripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip));

    // Charger tous les plans
    const plansSnapshot = await getDocs(collection(this.firestore, 'plans'));
    const plans: Plan[] = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));

    // Organiser la hiérarchie
    for (const user of users) {
      user.trips = trips
        .filter(trip => trip.userId === user.id)
        .sort((a, b) => {
          const dateA = a.startDate ? String(a.startDate) : '';
          const dateB = b.startDate ? String(b.startDate) : '';
          return dateA.localeCompare(dateB);
        });
      
      for (const trip of user.trips) {
        trip.plans = plans
          .filter(plan => plan.tripId === trip.id)
          .sort((a, b) => {
            const dateA = a.startDate ? String(a.startDate) : '';
            const dateB = b.startDate ? String(b.startDate) : '';
            return dateA.localeCompare(dateB);
          });
      }
    }
    return users;
  }
} 