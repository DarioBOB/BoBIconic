// Page de test simple affichant les voyages démo à partir de l'export Firebase
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DateTimeService } from '../services/date-time.service';

@Component({
  selector: 'app-bobbers',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Voyages Démo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content *ngIf="trips.length">
      <div *ngFor="let trip of trips" style="margin: 1em;">
        <h2>{{ trip.title?.fr || trip.title }}</h2>
        <p>{{ trip.startDate | date:'short' }} → {{ trip.endDate | date:'short' }}</p>
        <ul>
          <li *ngFor="let plan of trip.plans">
            {{ plan.title?.fr || plan.title }} :
            {{ plan.startDate | date:'shortTime' }} → {{ plan.endDate | date:'shortTime' }}
          </li>
        </ul>
      </div>
    </ion-content>
  `,
  styles: []
})
export class BobbersPage implements OnInit {
  trips: any[] = [];

  constructor(private http: HttpClient, private dateTime: DateTimeService) {}

  ngOnInit() {
    this.http.get('assets/Firebase Export.txt', { responseType: 'text' }).subscribe({
      next: text => this.processExport(text),
      error: err => console.error('Erreur chargement export', err)
    });
  }

  private processExport(text: string) {
    const sections: any = {};
    const regex = /### (\w+)\n([^#]+)/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      sections[m[1]] = JSON.parse(m[2].trim());
    }

    const DEMO_UID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
    const trips = (sections.trips || []).filter((t: any) => t.userId === DEMO_UID);
    const plans = (sections.plans || []).filter((p: any) => p.userId === DEMO_UID);

    trips.forEach((t: any) => {
      t.plans = plans.filter((p: any) => p.tripId === t.id);
    });

    this.applyDynamicDates(trips);
    this.trips = trips;
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
    const now = this.dateTime.getCurrentDateTime().date;
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
}
