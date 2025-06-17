import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="plan-card-premium" [class.expanded]="isExpanded">
      <div class="plan-card-icon" [ngStyle]="{'background': getPlanColor(plan?.type)}">
        <ion-icon [name]="getPlanIcon(plan?.type)"></ion-icon>
      </div>
      <div class="plan-card-content">
        <div class="plan-card-title">
          {{ getTitle(plan?.title) }}
          <ion-badge color="primary" *ngIf="plan?.type" class="plan-type-badge">
            {{ getPlanTypeLabel(plan?.type) | translate }}
          </ion-badge>
        </div>
        <div class="plan-card-details">
          <span *ngIf="plan?.details?.flightNumber">{{ plan.details.flightNumber }}</span>
          <span *ngIf="plan?.details?.company">{{ plan.details.company }}</span>
          <span *ngIf="plan?.details?.hotelName">{{ plan.details.hotelName }}</span>
        </div>
      </div>
      <div class="plan-card-date">
        <ng-container *ngIf="plan?.startDate as st">
          <ng-container *ngIf="st">{{ st | date:dateFormat }}</ng-container>
          <ng-container *ngIf="!st">-</ng-container>
        </ng-container>
        <span *ngIf="plan?.endDate"> - </span>
        <ng-container *ngIf="plan?.endDate as et">
          <ng-container *ngIf="et">{{ et | date:dateFormat }}</ng-container>
          <ng-container *ngIf="!et">-</ng-container>
        </ng-container>
      </div>
      <ion-button fill="clear" size="small" (click)="toggleDetails()" class="expand-button">
        <ion-icon [name]="isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'"></ion-icon>
      </ion-button>
      <div class="plan-card-expanded" *ngIf="isExpanded">
        <ion-list class="plan-details-list">
          <ion-item *ngFor="let detail of getPlanDetails()" lines="none">
            <ion-icon [name]="detail.icon" slot="start"></ion-icon>
            <ion-label><b>{{ detail.label }}</b></ion-label>
            <div slot="end">
              <ng-container *ngIf="detail.isDateField">
                <ng-container *ngIf="detail.value | date:dateFormat">{{ detail.value | date:dateFormat }}</ng-container>
                <ng-container *ngIf="!(detail.value | date:dateFormat)">-</ng-container>
              </ng-container>
              <ng-container *ngIf="!detail.isDateField">{{ detail.value }}</ng-container>
            </div>
          </ion-item>
          <ion-item *ngIf="getPlanDetails().length === 0" lines="none">
            <ion-label><i>Aucun détail disponible</i></ion-label>
          </ion-item>
        </ion-list>
      </div>
    </div>
  `,
  styleUrls: ['./plan-card.component.scss']
})
export class PlanCardComponent {
  @Input() plan: any;
  @Input() dateFormat: string = 'shortDate';
  isExpanded = false;

  toggleDetails() {
    this.isExpanded = !this.isExpanded;
  }

  getPlanIcon(type: string): string {
    switch ((type || '').toLowerCase()) {
      case 'flight': return 'airplane-outline';
      case 'car_rental': return 'car-outline';
      case 'hotel': return 'bed-outline';
      case 'activity': return 'walk-outline';
      default: return 'cube-outline';
    }
  }

  getPlanColor(type: string): string {
    switch ((type || '').toLowerCase()) {
      case 'flight': return 'linear-gradient(135deg, #ff9800 60%, #2196f3 100%)';
      case 'car_rental': return 'linear-gradient(135deg, #ffa726 60%, #66bb6a 100%)';
      case 'hotel': return 'linear-gradient(135deg, #66bb6a 60%, #29b6f6 100%)';
      case 'activity': return 'linear-gradient(135deg, #29b6f6 60%, #ab47bc 100%)';
      default: return 'linear-gradient(135deg, #bdbdbd 60%, #90caf9 100%)';
    }
  }

  getTitle(title: any): string {
    if (!title) return 'Sans titre';
    if (typeof title === 'string') return title;
    if (typeof title === 'object' && title.fr) return title.fr;
    return String(title);
  }

  getPlanTypeLabel(type: string): string {
    if (!type) return 'TRIPS.UNKNOWN';
    // Normalisation du type pour correspondre aux clés de traduction
    const normalized = type.replace(/\s|-/g, '_').replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
    return `TRIPS.${normalized}`;
  }

  getPlanDetails(): { label: string, value: string, icon: string, isDateField?: boolean }[] {
    if (!this.plan?.details) return [];
    
    const details = this.plan.details;
    const type = this.plan.type;
    const result: { label: string, value: string, icon: string, isDateField?: boolean }[] = [];

    // Champs spécifiques selon le type
    switch (type?.toLowerCase()) {
      case 'flight':
        if (details.flightNumber) result.push({ label: 'Numéro de vol', value: details.flightNumber, icon: 'airplane-outline' });
        if (details.airline) result.push({ label: 'Compagnie', value: details.airline, icon: 'business-outline' });
        if (details.class) result.push({ label: 'Classe', value: details.class, icon: 'ribbon-outline' });
        if (details.seat) result.push({ label: 'Siège', value: details.seat, icon: 'person-outline' });
        if (details.bookingReference) result.push({ label: 'Référence', value: details.bookingReference, icon: 'pricetag-outline' });
        break;
      case 'car_rental':
        if (details.carType) result.push({ label: 'Type de voiture', value: details.carType, icon: 'car-outline' });
        if (details.company) result.push({ label: 'Société', value: details.company, icon: 'business-outline' });
        if (details.pickupLocation) result.push({ label: 'Lieu de prise en charge', value: details.pickupLocation, icon: 'pin-outline' });
        if (details.dropoffLocation) result.push({ label: 'Lieu de retour', value: details.dropoffLocation, icon: 'pin-outline' });
        break;
      case 'hotel':
        if (details.hotelName) result.push({ label: 'Nom', value: details.hotelName, icon: 'home-outline' });
        if (details.roomType) result.push({ label: 'Type de chambre', value: details.roomType, icon: 'bed-outline' });
        if (details.checkInTime) result.push({ label: 'Check-in', value: details.checkInTime, icon: 'log-in-outline', isDateField: true });
        if (details.checkOutTime) result.push({ label: 'Check-out', value: details.checkOutTime, icon: 'log-out-outline', isDateField: true });
        if (details.confirmationNumber) result.push({ label: 'Confirmation', value: details.confirmationNumber, icon: 'pricetag-outline' });
        break;
      case 'activity':
        if (details.description) result.push({ label: 'Description', value: details.description, icon: 'information-circle-outline' });
        if (details.duration) result.push({ label: 'Durée', value: details.duration, icon: 'time-outline' });
        if (details.location) result.push({ label: 'Lieu', value: details.location, icon: 'pin-outline' });
        break;
    }

    // Si aucun champ connu n'a été trouvé, on affiche tous les champs de façon générique
    if (result.length === 0) {
      Object.keys(details).forEach(key => {
        if (details[key] && typeof details[key] !== 'object') {
          result.push({ label: key, value: details[key], icon: 'information-circle-outline' });
        }
      });
    }

    return result;
  }
} 