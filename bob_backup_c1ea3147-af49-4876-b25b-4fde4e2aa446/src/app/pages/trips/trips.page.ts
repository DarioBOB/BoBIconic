import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Firestore, collection, query, where, getDocs, doc, getDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { TranslateModule } from '@ngx-translate/core';
import { DemoService } from 'src/app/services/demo.service';

interface Trip {
  id: string;
  name?: string;
  description?: string;
  startDate: string;
  endDate: string;
  userId: string;
  from?: string;
  to?: string;
  type?: string;
}

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslateModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'TRIPS.TITLE' | translate }} <ion-badge *ngIf="isDemoMode" color="warning">DEMO</ion-badge></ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item-group>
          <ion-item-divider>
            <ion-label>{{ 'TRIPS.ONGOING' | translate }}</ion-label>
          </ion-item-divider>
          <ion-item *ngFor="let trip of ongoingTrips">
            <ion-label>
              <h2 *ngIf="trip.type === 'flight' && trip.from && trip.to">
                {{ 'TRIPS.FLIGHT_FROM_TO' | translate:{from: trip.from, to: trip.to} }}
              </h2>
              <h2 *ngIf="!(trip.type === 'flight' && trip.from && trip.to)">
                {{ trip.name || ('TRIPS.UNKNOWN' | translate) }}
              </h2>
              <p>{{ trip.description }}</p>
            </ion-label>
          </ion-item>
        </ion-item-group>

        <ion-item-group>
          <ion-item-divider>
            <ion-label>{{ 'TRIPS.UPCOMING' | translate }}</ion-label>
          </ion-item-divider>
          <ion-item *ngFor="let trip of upcomingTrips">
            <ion-label>
              <h2 *ngIf="trip.type === 'flight' && trip.from && trip.to">
                {{ 'TRIPS.FLIGHT_FROM_TO' | translate:{from: trip.from, to: trip.to} }}
              </h2>
              <h2 *ngIf="!(trip.type === 'flight' && trip.from && trip.to)">
                {{ trip.name || ('TRIPS.UNKNOWN' | translate) }}
              </h2>
              <p>{{ trip.description }}</p>
            </ion-label>
          </ion-item>
        </ion-item-group>

        <ion-item-group>
          <ion-item-divider>
            <ion-label>{{ 'TRIPS.PAST' | translate }}</ion-label>
          </ion-item-divider>
          <ion-item *ngFor="let trip of pastTrips">
            <ion-label>
              <h2 *ngIf="trip.type === 'flight' && trip.from && trip.to">
                {{ 'TRIPS.FLIGHT_FROM_TO' | translate:{from: trip.from, to: trip.to} }}
              </h2>
              <h2 *ngIf="!(trip.type === 'flight' && trip.from && trip.to)">
                {{ trip.name || ('TRIPS.UNKNOWN' | translate) }}
              </h2>
              <p>{{ trip.description }}</p>
            </ion-label>
          </ion-item>
        </ion-item-group>
      </ion-list>
    </ion-content>
  `,
  styles: [`
    ion-item-divider {
      --background: var(--ion-color-light);
      --color: var(--ion-color-dark);
      font-weight: bold;
    }
  `]
})
export class TripsPage implements OnInit, OnDestroy {
  ongoingTrips: Trip[] = [];
  upcomingTrips: Trip[] = [];
  pastTrips: Trip[] = [];
  isDemoMode = false;
  private authUnsubscribe: any;

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private demoService: DemoService
  ) {}

  async ngOnInit() {
    this.isDemoMode = this.demoService.isDemoMode();
    this.loadTrips();
    this.authUnsubscribe = onAuthStateChanged(this.auth, () => {
      this.isDemoMode = this.demoService.isDemoMode();
      this.loadTrips();
    });
  }

  ngOnDestroy() {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
  }

  async loadTrips() {
    let userId = '';
    let isAdmin = false;
    const user = await this.auth.currentUser;
    if (user) {
      const userRef = doc(this.firestore, `users/${user.uid}`);
      const snap = await getDoc(userRef);
      const data = snap.exists() ? snap.data() : null;
      isAdmin = !!(data && data['role'] === 'admin');
    }
    if (this.isDemoMode) {
      userId = 'guest-demo';
    } else if (user && !isAdmin) {
      userId = user.uid;
    }

    const tripsRef = collection(this.firestore, 'trips');
    let q;
    if (isAdmin) {
      q = tripsRef; // Pas de filtre userId
    } else {
      q = query(tripsRef, where('userId', '==', userId));
    }
    const querySnapshot = await getDocs(q);

    const now = new Date();
    this.ongoingTrips = [];
    this.upcomingTrips = [];
    this.pastTrips = [];

    querySnapshot.forEach((doc) => {
      const trip = { id: doc.id, ...doc.data() } as Trip;
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      if (startDate <= now && now <= endDate) {
        this.ongoingTrips.push(trip);
      } else if (startDate > now) {
        this.upcomingTrips.push(trip);
      } else {
        this.pastTrips.push(trip);
      }
    });
  }
} 