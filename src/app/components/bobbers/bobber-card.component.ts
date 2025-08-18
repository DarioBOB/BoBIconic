import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { BobberProfile, BobberMatch } from '../../models/bobber.interface';

@Component({
  selector: 'app-bobber-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-card class="bobber-card" [class.match-highlight]="match">
      <ion-card-header>
        <div class="bobber-header">
          <div class="avatar-container">
            <ion-avatar class="bobber-avatar">
              <img [src]="profile.avatar || 'assets/avatars/default-avatar.jpg'" 
                   [alt]="profile.displayName"
                   (error)="onAvatarError($event)">
            </ion-avatar>
            <div class="online-indicator" 
                 [class.online]="isOnline"
                 [class.offline]="!isOnline">
            </div>
          </div>
          
          <div class="bobber-info">
            <h3 class="bobber-name">{{ profile.displayName }}</h3>
            <p class="bobber-bio" *ngIf="profile.bio">{{ profile.bio }}</p>
            <div class="bobber-stats">
              <span class="stat">
                <ion-icon name="airplane"></ion-icon>
                {{ profile.totalFlights }} vols
              </span>
              <span class="stat">
                <ion-icon name="globe"></ion-icon>
                {{ profile.countriesVisited }} pays
              </span>
            </div>
          </div>

          <div class="bobber-actions">
            <ion-button fill="clear" size="small" (click)="onViewProfile()">
              <ion-icon name="person"></ion-icon>
            </ion-button>
            <ion-button fill="clear" size="small" (click)="onSendMessage()" 
                       [disabled]="!canSendMessage">
              <ion-icon name="chatbubble"></ion-icon>
            </ion-button>
          </div>
        </div>
      </ion-card-header>

      <ion-card-content>
        <div class="bobber-details">
          <!-- Style de voyage -->
          <div class="detail-item">
            <ion-icon name="briefcase" *ngIf="profile.travelStyle === 'business'"></ion-icon>
            <ion-icon name="sunny" *ngIf="profile.travelStyle === 'leisure'"></ion-icon>
            <ion-icon name="compass" *ngIf="profile.travelStyle === 'adventure'"></ion-icon>
            <ion-icon name="people" *ngIf="profile.travelStyle === 'family'"></ion-icon>
            <span class="detail-label">{{ getTravelStyleLabel(profile.travelStyle) }}</span>
          </div>

          <!-- Siège préféré -->
          <div class="detail-item">
            <ion-icon name="seat"></ion-icon>
            <span class="detail-label">Préfère {{ getSeatLabel(profile.preferredSeats) }}</span>
          </div>

          <!-- Intérêts -->
          <div class="interests-container" *ngIf="profile.interests.length > 0">
            <div class="interests-label">Intérêts :</div>
            <div class="interests-tags">
              <ion-chip *ngFor="let interest of profile.interests.slice(0, 3)" 
                       size="small" color="primary">
                {{ getInterestLabel(interest) }}
              </ion-chip>
              <ion-chip *ngIf="profile.interests.length > 3" 
                       size="small" color="medium">
                +{{ profile.interests.length - 3 }}
              </ion-chip>
            </div>
          </div>

          <!-- Badges -->
          <div class="badges-container" *ngIf="profile.badges.length > 0">
            <div class="badges-label">Badges :</div>
            <div class="badges-list">
              <ion-badge *ngFor="let badge of profile.badges.slice(0, 2)" 
                        color="success" class="badge">
                <ion-icon [name]="badge.icon"></ion-icon>
                {{ badge.name }}
              </ion-badge>
            </div>
          </div>

          <!-- Informations de compatibilité -->
          <div class="compatibility-info" *ngIf="match">
            <div class="compatibility-score">
              <div class="score-circle" [style.background]="getCompatibilityColor(match.compatibility)">
                {{ match.compatibility }}%
              </div>
              <span class="compatibility-label">Compatibilité</span>
            </div>
            
            <div class="match-reason">
              <ion-icon [name]="getMatchReasonIcon(match.matchReason)"></ion-icon>
              {{ getMatchReasonLabel(match.matchReason) }}
            </div>

            <div class="common-interests" *ngIf="match.commonInterests.length > 0">
              <span class="common-label">Intérêts communs :</span>
              <span class="common-tags">
                {{ match.commonInterests.join(', ') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="card-actions">
          <ion-button fill="outline" size="small" (click)="onConnect()" 
                     [disabled]="isConnected">
            <ion-icon name="add" *ngIf="!isConnected"></ion-icon>
            <ion-icon name="checkmark" *ngIf="isConnected"></ion-icon>
            {{ isConnected ? 'Connecté' : 'Se connecter' }}
          </ion-button>
          
          <ion-button fill="outline" size="small" (click)="onShare()">
            <ion-icon name="share"></ion-icon>
            Partager
          </ion-button>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .bobber-card {
      margin: 8px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .bobber-card.match-highlight {
      border: 2px solid var(--ion-color-primary);
      background: linear-gradient(135deg, rgba(var(--ion-color-primary-rgb), 0.05) 0%, rgba(var(--ion-color-primary-rgb), 0.02) 100%);
    }

    .bobber-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .avatar-container {
      position: relative;
      flex-shrink: 0;
    }

    .bobber-avatar {
      width: 60px;
      height: 60px;
      border: 3px solid var(--ion-color-light);
    }

    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
    }

    .online-indicator.online {
      background-color: var(--ion-color-success);
    }

    .online-indicator.offline {
      background-color: var(--ion-color-medium);
    }

    .bobber-info {
      flex: 1;
      min-width: 0;
    }

    .bobber-name {
      margin: 0 0 4px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .bobber-bio {
      margin: 0 0 8px 0;
      font-size: 0.9rem;
      color: var(--ion-color-medium);
      line-height: 1.3;
    }

    .bobber-stats {
      display: flex;
      gap: 12px;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .bobber-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .bobber-details {
      margin-bottom: 16px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }

    .detail-label {
      color: var(--ion-color-dark);
    }

    .interests-container, .badges-container {
      margin-top: 12px;
    }

    .interests-label, .badges-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--ion-color-medium);
      margin-bottom: 6px;
    }

    .interests-tags, .badges-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
    }

    .compatibility-info {
      margin-top: 16px;
      padding: 12px;
      background: rgba(var(--ion-color-primary-rgb), 0.05);
      border-radius: 8px;
      border-left: 4px solid var(--ion-color-primary);
    }

    .compatibility-score {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .score-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.8rem;
    }

    .compatibility-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .match-reason {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      margin-bottom: 6px;
    }

    .common-interests {
      font-size: 0.8rem;
    }

    .common-label {
      color: var(--ion-color-medium);
      font-weight: 600;
    }

    .common-tags {
      color: var(--ion-color-dark);
    }

    .card-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    @media (max-width: 480px) {
      .bobber-header {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .bobber-actions {
        flex-direction: row;
        justify-content: center;
      }

      .card-actions {
        flex-direction: column;
      }
    }
  `]
})
export class BobberCardComponent {
  @Input() profile!: BobberProfile;
  @Input() match?: BobberMatch;
  @Input() isOnline: boolean = false;
  @Input() isConnected: boolean = false;
  @Input() canSendMessage: boolean = true;

  @Output() viewProfile = new EventEmitter<string>();
  @Output() sendMessage = new EventEmitter<string>();
  @Output() connect = new EventEmitter<string>();
  @Output() share = new EventEmitter<BobberProfile>();

  onAvatarError(event: any) {
    event.target.src = 'assets/avatars/default-avatar.jpg';
  }

  getTravelStyleLabel(style: string): string {
    const labels = {
      'business': 'Voyageur d\'affaires',
      'leisure': 'Voyageur loisir',
      'adventure': 'Aventurier',
      'family': 'Voyageur famille'
    };
    return labels[style as keyof typeof labels] || style;
  }

  getSeatLabel(seat: string): string {
    const labels = {
      'window': 'fenêtre',
      'aisle': 'couloir',
      'front': 'avant',
      'back': 'arrière'
    };
    return labels[seat as keyof typeof labels] || seat;
  }

  getInterestLabel(interest: string): string {
    const labels = {
      'photography': 'Photo',
      'food': 'Cuisine',
      'culture': 'Culture',
      'nature': 'Nature',
      'sports': 'Sport',
      'music': 'Musique',
      'art': 'Art',
      'technology': 'Tech',
      'business': 'Business',
      'adventure': 'Aventure'
    };
    return labels[interest as keyof typeof labels] || interest;
  }

  getCompatibilityColor(score: number): string {
    if (score >= 80) return 'var(--ion-color-success)';
    if (score >= 60) return 'var(--ion-color-warning)';
    return 'var(--ion-color-danger)';
  }

  getMatchReasonIcon(reason: string): string {
    const icons = {
      'same-flight': 'airplane',
      'same-destination': 'location',
      'common-interests': 'heart',
      'nearby': 'location'
    };
    return icons[reason as keyof typeof icons] || 'people';
  }

  getMatchReasonLabel(reason: string): string {
    const labels = {
      'same-flight': 'Même vol',
      'same-destination': 'Même destination',
      'common-interests': 'Intérêts communs',
      'nearby': 'À proximité'
    };
    return labels[reason as keyof typeof labels] || reason;
  }

  onViewProfile() {
    this.viewProfile.emit(this.profile.id);
  }

  onSendMessage() {
    this.sendMessage.emit(this.profile.id);
  }

  onConnect() {
    this.connect.emit(this.profile.id);
  }

  onShare() {
    this.share.emit(this.profile);
  }
} 