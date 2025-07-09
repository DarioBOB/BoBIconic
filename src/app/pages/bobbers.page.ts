// Page de test simple affichant les voyages démo à partir de l'export Firebase
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { DateTimeService } from '../services/date-time.service';

@Component({
  selector: 'app-bobbers',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Voyages Démo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div *ngIf="loading" style="text-align: center; padding: 2em;">
        <ion-spinner></ion-spinner>
        <p>Chargement des voyages démo...</p>
      </div>

      <div *ngIf="error" style="text-align: center; padding: 2em; color: red;">
        <h3>Erreur de chargement</h3>
        <p>{{ error }}</p>
        <ion-button (click)="retryLoad()">Réessayer</ion-button>
      </div>

      <div *ngIf="!loading && !error && trips.length === 0" style="text-align: center; padding: 2em;">
        <h3>Aucun voyage démo trouvé</h3>
        <p>Vérifiez que le fichier Firebase Export.txt existe dans assets/</p>
      </div>

      <div *ngIf="!loading && !error && trips.length > 0">
        <div *ngFor="let trip of trips" style="margin: 1em; padding: 1em; border: 1px solid #ccc; border-radius: 8px;">
          <h2>{{ trip.title?.fr || trip.title }}</h2>
          <p><strong>Période :</strong> {{ trip.startDate | date:'short' }} → {{ trip.endDate | date:'short' }}</p>
          <p><strong>Status :</strong> {{ trip.status }}</p>
          <div *ngIf="trip.plans && trip.plans.length > 0">
            <h4>Plans :</h4>
            <ul>
              <li *ngFor="let plan of trip.plans">
                <strong>{{ plan.title?.fr || plan.title }}</strong> ({{ plan.type }}) :
                {{ plan.startDate | date:'shortTime' }} → {{ plan.endDate | date:'shortTime' }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: []
})
export class BobbersPage implements OnInit {
  trips: any[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private http: HttpClient, private dateTime: DateTimeService) {}

  ngOnInit() {
    this.loadTrips();
  }

  private loadTrips() {
    this.loading = true;
    this.error = null;
    this.http.get('assets/Firebase Export.txt', { responseType: 'text' }).subscribe({
      next: text => {
        console.log('[BOBBERS] Texte brut lu:', text.slice(0, 500));
        this.processExport(text);
      },
      error: err => {
        this.error = `Erreur de chargement du fichier: ${err.message}`;
        console.error('Erreur chargement export', err);
      },
      complete: () => this.loading = false
    });
  }

  private processExport(text: string) {
    const sections: any = {};
    // On ne garde que le texte à partir du premier ### (ignore l'entête)
    const cleanText = text.replace(/^[\s\S]*?(^### )/m, '$1');
    // Découpe sur chaque section ###
    const blocks = cleanText.split(/^\s*### /gm).filter(Boolean);
    for (const block of blocks) {
      const lines = block.split(/\r?\n/);
      const sectionName = lines[0].trim();
      const jsonText = lines.slice(1).join('\n').trim();
      if (!sectionName || !jsonText) continue;
      try {
        console.log(`[BOBBERS] Tentative parsing section ${sectionName}:`, jsonText.slice(0, 100));
        sections[sectionName] = JSON.parse(jsonText);
        console.log(`[BOBBERS] Section ${sectionName}:`, sections[sectionName]);
      } catch (e) {
        this.error = `Erreur de parsing JSON dans la section ${sectionName}: ${e}`;
        console.error(`[BOBBERS] Erreur parsing section ${sectionName}:`, e, jsonText);
        return;
      }
    }

    const DEMO_UID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
    const trips = (sections.trips || []).filter((t: any) => t.userId === DEMO_UID);
    const plans = (sections.plans || []).filter((p: any) => p.userId === DEMO_UID);
    console.log(`[BOBBERS] Trips trouvés: ${trips.length}, Plans trouvés: ${plans.length}`);

    trips.forEach((t: any) => {
      t.plans = plans.filter((p: any) => p.tripId === t.id);
    });

    this.applyDynamicDates(trips);
    this.trips = trips;
    console.log('[BOBBERS] Trips finaux:', this.trips);
  }

  private toDate(value: any): Date {
    if (!value) return new Date();
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    if (value instanceof Date) return value;
    if (value._seconds !== undefined && value._nanoseconds !== undefined) {
      return new Date(value._seconds * 1000 + Math.floor(value._nanoseconds / 1e6));
    }
    if (value.seconds !== undefined && value.nanoseconds !== undefined) {
      return new Date(value.seconds * 1000 + Math.floor(value.nanoseconds / 1e6));
    }
    if (value.toDate) return value.toDate();
    return new Date(value);
  }

  private applyDynamicDates(trips: any[]) {
    const now = new Date();
    const DAY = 24 * 60 * 60 * 1000;

    const past = trips.find(t => t.status === 'past');
    if (past) {
      const newStart = new Date(now.getTime() - 37 * DAY);
      const newEnd = new Date(now.getTime() - 30 * DAY);
      const offset = newStart.getTime() - this.toDate(past.startDate).getTime();
      past.startDate = newStart;
      past.endDate = newEnd;
      past.plans.forEach((p: any) => {
        p.startDate = new Date(this.toDate(p.startDate).getTime() + offset);
        p.endDate = new Date(this.toDate(p.endDate).getTime() + offset);
      });
    }

    const future = trips.find(t => t.status === 'upcoming');
    if (future) {
      const newStart = new Date(now.getTime() + 60 * DAY);
      const newEnd = new Date(now.getTime() + 67 * DAY);
      const offset = newStart.getTime() - this.toDate(future.startDate).getTime();
      future.startDate = newStart;
      future.endDate = newEnd;
      future.plans.forEach((p: any) => {
        p.startDate = new Date(this.toDate(p.startDate).getTime() + offset);
        p.endDate = new Date(this.toDate(p.endDate).getTime() + offset);
      });
    }

    const ongoing = trips.find(t => t.status === 'ongoing');
    if (ongoing) {
      const flights = ongoing.plans.filter((p: any) => p.type === 'flight');
      if (flights.length) {
        const first = flights.reduce((min: any, p: any) => this.toDate(p.startDate) < this.toDate(min.startDate) ? p : min, flights[0]);
        const origStart = this.toDate(first.startDate);
        const origEnd = this.toDate(first.endDate);
        const duration = origEnd.getTime() - origStart.getTime();
        const newFlightStart = new Date(now.getTime() - duration / 3);
        const newFlightEnd = new Date(now.getTime() + duration * 2 / 3);
        const offset = newFlightStart.getTime() - origStart.getTime();
        ongoing.startDate = new Date(this.toDate(ongoing.startDate).getTime() + offset);
        ongoing.endDate = new Date(this.toDate(ongoing.endDate).getTime() + offset);
        ongoing.plans.forEach((p: any) => {
          let start = new Date(this.toDate(p.startDate).getTime() + offset);
          let end = new Date(this.toDate(p.endDate).getTime() + offset);
          if (p.id === first.id) {
            start = newFlightStart;
            end = newFlightEnd;
          }
          p.startDate = start;
          p.endDate = end;
        });
      }
    }
  }

  retryLoad() {
    this.loadTrips();
  }
}
