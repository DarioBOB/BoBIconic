import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { BobberCardComponent } from './bobber-card.component';
import { BobbersService } from '../../services/bobbers.service';
import { BobberMatch, BobberProfile } from '../../models/bobber.interface';

@Component({
  selector: 'app-bobbers-nearby',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, BobberCardComponent],
  template: `
    <div class="nearby-container">
      <!-- En-tête avec filtres -->
      <div class="filters-header">
        <ion-searchbar
          [(ngModel)]="searchTerm"
          placeholder="Rechercher un Bobber..."
          (ionInput)="onSearchChange($event)"
          [debounce]="300"
        ></ion-searchbar>

        <div class="filter-chips">
          <ion-chip 
            *ngFor="let filter of availableFilters" 
            [color]="activeFilters.includes(filter.value) ? 'primary' : 'medium'"
            (click)="toggleFilter(filter.value)"
            [outline]="!activeFilters.includes(filter.value)">
            <ion-icon [name]="filter.icon"></ion-icon>
            <ion-label>{{ filter.label }}</ion-label>
          </ion-chip>
        </div>

        <div class="sort-options">
          <ion-select 
            [(ngModel)]="sortBy" 
            (ionChange)="onSortChange($event)"
            interface="popover">
            <ion-select-option value="compatibility">Compatibilité</ion-select-option>
            <ion-select-option value="distance">Distance</ion-select-option>
            <ion-select-option value="name">Nom</ion-select-option>
            <ion-select-option value="flights">Nombre de vols</ion-select-option>
          </ion-select>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="stats-bar">
        <div class="stat-item">
          <ion-icon name="people"></ion-icon>
          <span>{{ filteredBobbers.length }} Bobbers</span>
        </div>
        <div class="stat-item">
          <ion-icon name="airplane"></ion-icon>
          <span>{{ bobbersOnSameFlight.length }} sur le même vol</span>
        </div>
        <div class="stat-item">
          <ion-icon name="location"></ion-icon>
          <span>{{ bobbersNearby.length }} à proximité</span>
        </div>
      </div>

      <!-- Liste des Bobbers -->
      <div class="bobbers-list" *ngIf="!loading">
        <div *ngIf="filteredBobbers.length === 0" class="empty-state">
          <ion-icon name="people-outline" size="large"></ion-icon>
          <h3>Aucun Bobber trouvé</h3>
          <p>Aucun Bobber ne correspond à vos critères de recherche.</p>
        </div>

        <app-bobber-card
          *ngFor="let match of filteredBobbers"
          [profile]="match.profile"
          [match]="match"
          [isOnline]="isBobberOnline(match.userId)"
          [isConnected]="isBobberConnected(match.userId)"
          [canSendMessage]="canSendMessageToBobber(match.userId)"
          (viewProfile)="onViewProfile($event)"
          (sendMessage)="onSendMessage($event)"
          (connect)="onConnect($event)"
          (share)="onShare($event)">
        </app-bobber-card>
      </div>

      <!-- Loading state -->
      <div *ngIf="loading" class="loading-state">
        <ion-spinner name="crescent"></ion-spinner>
        <p>Recherche de Bobbers...</p>
      </div>

      <!-- Refresh button -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="refreshData()" size="small">
          <ion-icon name="refresh"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </div>
  `,
  styles: [`
    .nearby-container {
      padding: 16px;
    }

    .filters-header {
      margin-bottom: 16px;
    }

    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 12px 0;
    }

    .sort-options {
      margin-top: 12px;
    }

    .stats-bar {
      display: flex;
      justify-content: space-around;
      background: var(--ion-color-light);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }

    .stat-item ion-icon {
      font-size: 1.2rem;
      color: var(--ion-color-primary);
    }

    .bobbers-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--ion-color-medium);
    }

    .empty-state ion-icon {
      font-size: 4rem;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px 0;
      color: var(--ion-color-dark);
    }

    .empty-state p {
      margin: 0;
      font-size: 0.9rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: var(--ion-color-medium);
    }

    .loading-state p {
      margin-top: 12px;
      font-size: 0.9rem;
    }

    @media (max-width: 480px) {
      .nearby-container {
        padding: 8px;
      }

      .stats-bar {
        flex-direction: column;
        gap: 8px;
      }

      .stat-item {
        flex-direction: row;
        justify-content: center;
      }
    }
  `]
})
export class BobbersNearbyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données
  allBobbers: BobberMatch[] = [];
  filteredBobbers: BobberMatch[] = [];
  bobbersOnSameFlight: BobberMatch[] = [];
  bobbersNearby: BobberMatch[] = [];

  // État
  loading: boolean = true;
  searchTerm: string = '';
  sortBy: string = 'compatibility';
  activeFilters: string[] = [];

  // Filtres disponibles
  availableFilters = [
    { value: 'online', label: 'En ligne', icon: 'radio-button-on' },
    { value: 'same-flight', label: 'Même vol', icon: 'airplane' },
    { value: 'nearby', label: 'À proximité', icon: 'location' },
    { value: 'business', label: 'Business', icon: 'briefcase' },
    { value: 'leisure', label: 'Loisir', icon: 'sunny' },
    { value: 'adventure', label: 'Aventure', icon: 'compass' },
    { value: 'family', label: 'Famille', icon: 'people' }
  ];

  constructor(private bobbersService: BobbersService) {}

  ngOnInit() {
    this.loadData();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData() {
    this.loading = true;
    
    // Simuler un vol en cours (LX1820)
    const currentFlight = 'LX1820';
    const currentAirport = 'GVA';

    // Charger les Bobbers sur le même vol
    this.bobbersService.getBobbersOnSameFlight(currentFlight)
      .pipe(takeUntil(this.destroy$))
      .subscribe(bobbers => {
        this.bobbersOnSameFlight = bobbers;
      });

    // Charger les Bobbers à proximité
    this.bobbersService.getBobbersNearby(currentAirport)
      .pipe(takeUntil(this.destroy$))
      .subscribe(bobbers => {
        this.bobbersNearby = bobbers;
      });

    // Combiner toutes les données
    combineLatest([
      this.bobbersService.getBobbersOnSameFlight(currentFlight),
      this.bobbersService.getBobbersNearby(currentAirport)
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([sameFlight, nearby]) => {
        // Éviter les doublons
        const allBobbers = [...sameFlight];
        nearby.forEach(bobber => {
          if (!allBobbers.find(b => b.userId === bobber.userId)) {
            allBobbers.push(bobber);
          }
        });

        this.allBobbers = allBobbers;
        this.applyFilters();
        this.loading = false;
      });
  }

  private setupSubscriptions() {
    // Écouter les changements de localisation
    this.bobbersService.locations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.applyFilters();
  }

  toggleFilter(filterValue: string) {
    const index = this.activeFilters.indexOf(filterValue);
    if (index > -1) {
      this.activeFilters.splice(index, 1);
    } else {
      this.activeFilters.push(filterValue);
    }
    this.applyFilters();
  }

  onSortChange(event: any) {
    this.sortBy = event.detail.value;
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = [...this.allBobbers];

    // Filtre par recherche
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(bobber =>
        bobber.profile.displayName.toLowerCase().includes(searchLower) ||
        bobber.profile.bio?.toLowerCase().includes(searchLower) ||
        bobber.profile.interests.some(interest => 
          interest.toLowerCase().includes(searchLower)
        )
      );
    }

    // Filtres actifs
    this.activeFilters.forEach(filter => {
      switch (filter) {
        case 'online':
          filtered = filtered.filter(bobber => this.isBobberOnline(bobber.userId));
          break;
        case 'same-flight':
          filtered = filtered.filter(bobber => 
            this.bobbersOnSameFlight.some(b => b.userId === bobber.userId)
          );
          break;
        case 'nearby':
          filtered = filtered.filter(bobber => 
            this.bobbersNearby.some(b => b.userId === bobber.userId)
          );
          break;
        case 'business':
        case 'leisure':
        case 'adventure':
        case 'family':
          filtered = filtered.filter(bobber => 
            bobber.profile.travelStyle === filter
          );
          break;
      }
    });

    // Tri
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'compatibility':
          return b.compatibility - a.compatibility;
        case 'distance':
          return (a.distance || 0) - (b.distance || 0);
        case 'name':
          return a.profile.displayName.localeCompare(b.profile.displayName);
        case 'flights':
          return b.profile.totalFlights - a.profile.totalFlights;
        default:
          return 0;
      }
    });

    this.filteredBobbers = filtered;
  }

  isBobberOnline(userId: string): boolean {
    // Simulation - en vrai, on utiliserait le service de localisation
    return Math.random() > 0.3; // 70% de chance d'être en ligne
  }

  isBobberConnected(userId: string): boolean {
    // Simulation - en vrai, on vérifierait les connexions
    return Math.random() > 0.7; // 30% de chance d'être connecté
  }

  canSendMessageToBobber(userId: string): boolean {
    // Simulation - en vrai, on vérifierait les permissions
    return this.isBobberConnected(userId) || Math.random() > 0.5;
  }

  onViewProfile(userId: string) {
    console.log('Voir profil:', userId);
    // Navigation vers le profil
  }

  onSendMessage(userId: string) {
    console.log('Envoyer message à:', userId);
    // Ouvrir le chat
  }

  onConnect(userId: string) {
    console.log('Se connecter avec:', userId);
    // Envoyer une demande de connexion
  }

  onShare(profile: BobberProfile) {
    console.log('Partager profil:', profile);
    // Partager le profil
  }

  refreshData() {
    this.loadData();
  }
} 