import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Game, GameCategory, GameDifficulty } from '../../models/game.interface';

@Component({
  selector: 'app-game-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-card class="game-card" [class.active]="isActive">
      <div class="game-header">
        <div class="game-icon">
          <ion-icon [name]="game.icon" size="large"></ion-icon>
        </div>
        
        <div class="game-info">
          <h3>{{ game.name }}</h3>
          <p class="game-description">{{ game.description }}</p>
          
          <div class="game-meta">
            <ion-chip size="small" [color]="getDifficultyColor(game.difficulty)">
              {{ getDifficultyLabel(game.difficulty) }}
            </ion-chip>
            
            <ion-chip size="small" color="secondary">
              <ion-icon name="time"></ion-icon>
              {{ game.estimatedDuration }} min
            </ion-chip>
            
            <ion-chip size="small" color="tertiary">
              <ion-icon name="people"></ion-icon>
              {{ game.minPlayers }}-{{ game.maxPlayers }}
            </ion-chip>
          </div>
        </div>
      </div>

      <ion-card-content>
        <div class="game-rules">
          <h4>Règles :</h4>
          <ul>
            <li *ngFor="let rule of game.rules.slice(0, 3)">{{ rule }}</li>
            <li *ngIf="game.rules.length > 3" class="more-rules">
              +{{ game.rules.length - 3 }} autres règles
            </li>
          </ul>
        </div>

        <div class="game-tags">
          <ion-chip *ngFor="let tag of game.tags.slice(0, 3)" size="small" color="light">
            {{ tag }}
          </ion-chip>
        </div>

        <div class="game-stats" *ngIf="showStats">
          <div class="stat-item">
            <ion-icon name="trophy"></ion-icon>
            <span>Meilleur score: {{ bestScore }}</span>
          </div>
          <div class="stat-item">
            <ion-icon name="play"></ion-icon>
            <span>{{ gamesPlayed }} parties</span>
          </div>
        </div>
      </ion-card-content>

      <div class="game-actions">
        <ion-button 
          fill="outline" 
          size="small" 
          (click)="onViewDetails()">
          <ion-icon name="information-circle"></ion-icon>
          Détails
        </ion-button>
        
        <ion-button 
          fill="solid" 
          color="primary" 
          size="small" 
          (click)="onPlayGame()">
          <ion-icon name="play"></ion-icon>
          Jouer
        </ion-button>
        
        <ion-button 
          fill="clear" 
          size="small" 
          (click)="onCreateSession()">
          <ion-icon name="add-circle"></ion-icon>
          Créer
        </ion-button>
      </div>

      <div class="game-status" *ngIf="isActive">
        <ion-badge color="success">
          <ion-icon name="radio-button-on"></ion-icon>
          En cours
        </ion-badge>
      </div>
    </ion-card>
  `,
  styles: [`
    .game-card {
      margin: 12px 0;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .game-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .game-card.active {
      border: 2px solid var(--ion-color-primary);
    }

    .game-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 16px 0 16px;
    }

    .game-icon {
      flex-shrink: 0;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .game-info {
      flex: 1;
      min-width: 0;
    }

    .game-info h3 {
      margin: 0 0 8px 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .game-description {
      margin: 0 0 12px 0;
      font-size: 0.9rem;
      color: var(--ion-color-medium);
      line-height: 1.4;
    }

    .game-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .game-meta ion-chip {
      font-size: 0.7rem;
    }

    ion-card-content {
      padding: 12px 16px;
    }

    .game-rules h4 {
      margin: 0 0 8px 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .game-rules ul {
      margin: 0;
      padding-left: 16px;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }

    .game-rules li {
      margin-bottom: 4px;
    }

    .more-rules {
      color: var(--ion-color-primary);
      font-style: italic;
    }

    .game-tags {
      display: flex;
      gap: 6px;
      margin: 12px 0;
      flex-wrap: wrap;
    }

    .game-stats {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--ion-color-light-shade);
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      margin-bottom: 4px;
    }

    .stat-item ion-icon {
      color: var(--ion-color-primary);
    }

    .game-actions {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--ion-color-light-shade);
      background: var(--ion-color-light);
    }

    .game-actions ion-button {
      flex: 1;
      --border-radius: 8px;
      font-size: 0.8rem;
    }

    .game-status {
      position: absolute;
      top: 12px;
      right: 12px;
    }

    .game-status ion-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
    }

    @media (max-width: 480px) {
      .game-header {
        flex-direction: column;
        text-align: center;
      }

      .game-icon {
        align-self: center;
      }

      .game-meta {
        justify-content: center;
      }

      .game-actions {
        flex-direction: column;
      }
    }
  `]
})
export class GameCardComponent {
  @Input() game!: Game;
  @Input() isActive: boolean = false;
  @Input() showStats: boolean = false;
  @Input() bestScore: number = 0;
  @Input() gamesPlayed: number = 0;

  @Output() viewDetails = new EventEmitter<Game>();
  @Output() playGame = new EventEmitter<Game>();
  @Output() createSession = new EventEmitter<Game>();

  getDifficultyColor(difficulty: GameDifficulty): string {
    const colors = {
      [GameDifficulty.EASY]: 'success',
      [GameDifficulty.MEDIUM]: 'warning',
      [GameDifficulty.HARD]: 'danger',
      [GameDifficulty.EXPERT]: 'dark'
    };
    return colors[difficulty] || 'medium';
  }

  getDifficultyLabel(difficulty: GameDifficulty): string {
    const labels = {
      [GameDifficulty.EASY]: 'Facile',
      [GameDifficulty.MEDIUM]: 'Moyen',
      [GameDifficulty.HARD]: 'Difficile',
      [GameDifficulty.EXPERT]: 'Expert'
    };
    return labels[difficulty] || 'Inconnu';
  }

  onViewDetails() {
    this.viewDetails.emit(this.game);
  }

  onPlayGame() {
    this.playGame.emit(this.game);
  }

  onCreateSession() {
    this.createSession.emit(this.game);
  }
} 