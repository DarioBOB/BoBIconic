import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { Firestore, collection, query, where, getDocs, Timestamp, doc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

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
}

interface Plan {
  id: string;
  title: string | { fr: string; en: string };
  description: string;
  type: 'flight' | 'hotel' | 'car' | 'activity' | 'other';
  startDate: Date;
  startTime: Date;
  endDate: Date;
  endTime: Date;
  details?: any;
}

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SharedModule, TranslateModule],
  templateUrl: './trips.page.html',
  styleUrls: ['./trips.page.scss']
})
export class TripsPage implements OnInit {
  selectedSegment: 'ongoing' | 'upcoming' | 'past' = 'ongoing';
  ongoingTrips: Trip[] = [];
  upcomingTrips: Trip[] = [];
  pastTrips: Trip[] = [];
  isLoading = false;
  error: string | null = null;
  userId: string | null = null;

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  ngOnInit() {
    this.userId = this.auth.currentUser?.uid || null;
    this.loadTrips();
  }

  async loadTrips() {
    this.isLoading = true;
    this.error = null;

    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const tripsRef = collection(this.firestore, 'trips');
      const q = query(tripsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      let trips: Trip[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        trips.push({
          id: doc.id,
          title: data['title'],
          startDate: (data['startDate'] as Timestamp).toDate(),
          endDate: (data['endDate'] as Timestamp).toDate(),
          status: 'upcoming', // temporaire, on va overrider
          showDetails: false,
          loadingPlans: false
        });
      });

      // Si user démo, override les dates localement
      if (userId === 'fUBBVpboDeaUjD6w2nz0xKni9mG3' && trips.length >= 3) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const addDays = (base: Date, n: number, endOfDay = false) => {
          const d = new Date(base);
          d.setDate(d.getDate() + n);
          if (endOfDay) d.setHours(23, 59, 59, 999);
          else d.setHours(0, 0, 0, 0);
          return d;
        };
        const lang = this.getCurrentLang();
        // Destinations variées
        const destinations = [
          { fr: 'Barcelone', en: 'Barcelona' },
          { fr: 'Rome', en: 'Rome' },
          { fr: 'Londres', en: 'London' }
        ];
        // Titres dynamiques par statut et langue
        const titles = [
          {
            fr: `Voyage passé à ${destinations[0].fr}`,
            en: `Past trip to ${destinations[0].en}`
          },
          {
            fr: `Voyage en cours à ${destinations[1].fr}`,
            en: `Current trip to ${destinations[1].en}`
          },
          {
            fr: `Voyage à venir à ${destinations[2].fr}`,
            en: `Upcoming trip to ${destinations[2].en}`
          }
        ];
        // Plans démo pour chaque voyage
        const demoPlans = [
          [ // Passé - Barcelone
            {
              id: 'plan1',
              type: 'flight' as const,
              title: { fr: 'Vol Paris → Barcelone', en: 'Flight Paris → Barcelona' },
              description: lang === 'fr' ? 'Vol direct avec Vueling.' : 'Direct flight with Vueling.',
              startDate: addDays(today, -10),
              startTime: addDays(today, -10, false),
              endDate: addDays(today, -10),
              endTime: addDays(today, -10, false)
            },
            {
              id: 'plan2',
              type: 'hotel' as const,
              title: { fr: 'Hôtel Barcelona Center', en: 'Barcelona Center Hotel' },
              description: lang === 'fr' ? 'Séjour au cœur de Barcelone.' : 'Stay in the heart of Barcelona.',
              startDate: addDays(today, -10),
              startTime: addDays(today, -10, false),
              endDate: addDays(today, -5),
              endTime: addDays(today, -5, true)
            }
          ],
          [ // En cours - Rome
            {
              id: 'plan3',
              type: 'flight' as const,
              title: { fr: 'Vol Genève → Rome', en: 'Flight Geneva → Rome' },
              description: lang === 'fr' ? 'Arrivée à Rome Fiumicino.' : 'Arrival at Rome Fiumicino.',
              startDate: addDays(today, -1),
              startTime: addDays(today, -1, false),
              endDate: addDays(today, -1),
              endTime: addDays(today, -1, false)
            },
            {
              id: 'plan4',
              type: 'hotel' as const,
              title: { fr: 'Hôtel Roma Centro', en: 'Rome Center Hotel' },
              description: lang === 'fr' ? 'Chambre avec vue sur le Colisée.' : 'Room with Colosseum view.',
              startDate: addDays(today, -1),
              startTime: addDays(today, -1, false),
              endDate: addDays(today, 2),
              endTime: addDays(today, 2, true)
            },
            {
              id: 'plan5',
              type: 'activity' as const,
              title: { fr: 'Visite du Vatican', en: 'Vatican Tour' },
              description: lang === 'fr' ? 'Tour guidé du Vatican.' : 'Guided tour of the Vatican.',
              startDate: addDays(today, 1),
              startTime: addDays(today, 1, false),
              endDate: addDays(today, 1),
              endTime: addDays(today, 1, true)
            }
          ],
          [ // À venir - Londres
            {
              id: 'plan6',
              type: 'flight' as const,
              title: { fr: 'Vol Paris → Londres', en: 'Flight Paris → London' },
              description: lang === 'fr' ? 'Départ de CDG, arrivée à Heathrow.' : 'Departure from CDG, arrival at Heathrow.',
              startDate: addDays(today, 5),
              startTime: addDays(today, 5, false),
              endDate: addDays(today, 5),
              endTime: addDays(today, 5, false)
            },
            {
              id: 'plan7',
              type: 'hotel' as const,
              title: { fr: 'Hôtel London Bridge', en: 'London Bridge Hotel' },
              description: lang === 'fr' ? 'Séjour près de la Tamise.' : 'Stay near the Thames.',
              startDate: addDays(today, 5),
              startTime: addDays(today, 5, false),
              endDate: addDays(today, 10),
              endTime: addDays(today, 10, true)
            },
            {
              id: 'plan8',
              type: 'activity' as const,
              title: { fr: 'Comédie musicale', en: 'Musical Show' },
              description: lang === 'fr' ? 'Spectacle dans le West End.' : 'Show in the West End.',
              startDate: addDays(today, 7),
              startTime: addDays(today, 7, false),
              endDate: addDays(today, 7),
              endTime: addDays(today, 7, true)
            }
          ]
        ];
        trips = [
          {
            ...trips[0],
            startDate: addDays(today, -10),
            endDate: addDays(today, -5, true),
            status: 'past',
            title: { fr: titles[0].fr, en: titles[0].en },
            plans: demoPlans[0]
          },
          {
            ...trips[1],
            startDate: addDays(today, -1),
            endDate: addDays(today, 2, true),
            status: 'ongoing',
            title: { fr: titles[1].fr, en: titles[1].en },
            plans: demoPlans[1]
          },
          {
            ...trips[2],
            startDate: addDays(today, 5),
            endDate: addDays(today, 10, true),
            status: 'upcoming',
            title: { fr: titles[2].fr, en: titles[2].en },
            plans: demoPlans[2]
          }
        ];
      } else {
        // Sinon, status normal
        const now = new Date();
        trips = trips.map(trip => ({
          ...trip,
          status: this.getTripStatus(trip.startDate, trip.endDate)
        }));
      }

      // Séparer les voyages par catégorie
      this.ongoingTrips = trips.filter(trip => trip.status === 'ongoing');
      this.upcomingTrips = trips.filter(trip => trip.status === 'upcoming');
      this.pastTrips = trips.filter(trip => trip.status === 'past');

    } catch (error: any) {
      console.error('Error loading trips:', error);
      this.error = error.message || 'An error occurred while loading trips';
    } finally {
      this.isLoading = false;
    }
  }

  getTripStatus(startDate: Date, endDate: Date): 'ongoing' | 'upcoming' | 'past' {
    const now = new Date();
    if (now < startDate) {
      return 'upcoming';
    } else if (now > endDate) {
      return 'past';
    } else {
      return 'ongoing';
    }
  }

  async toggleTripDetails(trip: Trip) {
    trip.showDetails = !trip.showDetails;
    
    if (trip.showDetails && !trip.plans) {
      await this.loadTripPlans(trip);
    }
  }

  async loadTripPlans(trip: Trip & { planError?: string }) {
    trip.loadingPlans = true;
    trip.planError = undefined;
    try {
      if (this.userId === 'fUBBVpboDeaUjD6w2nz0xKni9mG3') {
        trip.loadingPlans = false;
        return;
      }
      const plansRef = collection(this.firestore, 'plans');
      const q = query(plansRef, where('tripId', '==', trip.id));
      const querySnapshot = await getDocs(q);
      const plans: Plan[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        plans.push({
          id: docSnap.id,
          title: data['title'],
          description: data['description'],
          type: data['type'],
          startDate: data['startDate'] instanceof Timestamp ? data['startDate'].toDate() : data['startDate'],
          startTime: data['startTime'] instanceof Timestamp ? data['startTime'].toDate() : data['startTime'],
          endDate: data['endDate'] instanceof Timestamp ? data['endDate'].toDate() : data['endDate'],
          endTime: data['endTime'] instanceof Timestamp ? data['endTime'].toDate() : data['endTime'],
          details: data['details']
        });
      });
      plans.sort((a, b) => (a.startTime?.getTime?.() ?? a.startDate?.getTime?.() ?? 0) - (b.startTime?.getTime?.() ?? b.startDate?.getTime?.() ?? 0));
      trip.plans = plans;
    } catch (error: any) {
      console.error('[PLANS ERROR]', error, 'tripId:', trip.id, 'user:', this.userId);
      trip.planError = error.message || 'Failed to load plans';
    } finally {
      trip.loadingPlans = false;
    }
  }

  getPlanIcon(type?: string): string {
    switch (type) {
      case 'flight':
        return 'airplane';
      case 'hotel':
        return 'bed';
      case 'car':
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
        return 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)';
      case 'hotel':
        return 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)';
      case 'car':
        return 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
      case 'activity':
        return 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)';
      default:
        return 'linear-gradient(135deg, #607d8b 0%, #455a64 100%)';
    }
  }

  getPlanBadgeColor(type: string): string {
    switch (type) {
      case 'flight':
        return 'primary';
      case 'hotel':
        return 'success';
      case 'car':
        return 'warning';
      case 'activity':
        return 'tertiary';
      default:
        return 'medium';
    }
  }

  getCurrentLang(): 'fr' | 'en' {
    return (localStorage.getItem('lang') as 'fr' | 'en') || 'fr';
  }

  getTitle(title: any): string {
    if (!title) return '';
    if (typeof title === 'string') return title;
    const lang = this.getCurrentLang();
    return title[lang] || title['fr'] || title['en'] || Object.values(title)[0] || '';
  }

  getDescription(desc: any): string {
    if (!desc) return '';
    if (typeof desc === 'string') return desc;
    const lang = this.getCurrentLang();
    return desc[lang] || desc['fr'] || desc['en'] || Object.values(desc)[0] || '';
  }

  getFlightTitle(from: string, to: string): string {
    const lang = this.getCurrentLang();
    if (lang === 'fr') {
      return `Vol de ${from} à ${to}`;
    } else {
      return `Flight from ${from} to ${to}`;
    }
  }
} 