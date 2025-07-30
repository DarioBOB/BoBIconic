import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Game, GameSession, GameStatistics, Achievement } from '../models/game.model';

@Component({
  selector: 'app-games',
  templateUrl: './games.page.html',
  styleUrls: ['./games.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class GamesPage implements OnInit {
  games: Game[] = [];
  recentSessions: GameSession[] = [];
  achievements: Achievement[] = [];
  statistics: GameStatistics = {
    totalSessions: 0,
    averageScore: 0,
    bestScore: 0,
    favoriteGame: ''
  };
  
  selectedGame: Game | null = null;
  showCreateSessionModal = false;
  sessionConfig = {
    rounds: 5,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  };

  constructor() {}

  ngOnInit() {
    this.loadGames();
    this.loadRecentSessions();
    this.loadAchievements();
    this.loadStatistics();
  }

  loadGames() {
    // Données de démonstration
    this.games = [
      {
        id: 'game-4096',
        name: '4096',
        description: 'Fusionnez les tuiles pour atteindre 4096 !',
        category: 'puzzle',
        difficulty: 'medium',
        icon: '🎮',
        imageUrl: ''
      },
      {
        id: 'word-scramble',
        name: 'Mots Mêlés',
        description: 'Trouvez des mots dans une grille de lettres',
        category: 'word',
        difficulty: 'medium',
        icon: '📝',
        imageUrl: ''
      },
      {
        id: 'trivia-quiz',
        name: 'Quiz Culture Générale',
        description: 'Testez vos connaissances',
        category: 'trivia',
        difficulty: 'medium',
        icon: '❓',
        imageUrl: ''
      },
      {
        id: 'memory-cards',
        name: 'Memory',
        description: 'Retrouvez les paires de cartes',
        category: 'memory',
        difficulty: 'easy',
        icon: '🃏',
        imageUrl: ''
      },
      {
        id: 'pacman',
        name: 'Pac-Man',
        description: 'Mangez toutes les pastilles avant que le fantôme ne vous attrape !',
        category: 'arcade',
        difficulty: 'medium',
        icon: '👻',
        imageUrl: ''
      }
    ];
  }

  loadRecentSessions() {
    this.recentSessions = [
      {
        id: '1',
        gameId: 'word-scramble',
        score: 850,
        date: new Date('2024-01-15'),
        duration: 300
      },
      {
        id: '2',
        gameId: 'trivia-quiz',
        score: 720,
        date: new Date('2024-01-14'),
        duration: 240
      }
    ];
  }

  loadAchievements() {
    this.achievements = [
      {
        id: 'first-win',
        name: 'Première Victoire',
        description: 'Gagnez votre première partie',
        isUnlocked: true,
        icon: 'trophy'
      },
      {
        id: 'word-master',
        name: 'Maître des Mots',
        description: 'Jouez 10 parties de mots mêlés',
        isUnlocked: false,
        icon: 'text'
      }
    ];
  }

  loadStatistics() {
    this.statistics = {
      totalSessions: 15,
      averageScore: 650,
      bestScore: 950,
      favoriteGame: 'word-scramble'
    };
  }

  getFavoriteGameName(): string {
    const game = this.games.find(g => g.id === this.statistics.favoriteGame);
    return game?.name || 'Aucun';
  }

  getGameColor(category: string): string {
    const colors = {
      'puzzle': '#4CAF50',    // Vert pour les puzzles
      'word': '#2196F3',      // Bleu pour les mots
      'trivia': '#FF9800',    // Orange pour les quiz
      'memory': '#9C27B0',    // Violet pour la mémoire
      'arcade': '#E91E63'     // Rose pour les jeux d'arcade
    };
    return colors[category as keyof typeof colors] || '#666';
  }

  selectGame(game: Game) {
    this.selectedGame = game;
    this.showCreateSessionModal = true;
  }

  startGame(game: Game) {
    if (game.id === 'game-4096') {
      // Navigation vers le jeu 4096
      window.location.href = '/game-4096';
    } else if (game.id === 'word-scramble') {
      // Navigation vers le jeu Mots Mêlés
      window.location.href = '/word-scramble';
    } else if (game.id === 'trivia-quiz') {
      // Navigation vers le Quiz
      window.location.href = '/quiz';
    } else if (game.id === 'memory-cards') {
      // Navigation vers le Memory
      window.location.href = '/memory';
    } else if (game.id === 'pacman') {
      // Navigation vers Pac-Man
      window.location.href = '/pacman';
    } else {
      this.selectGame(game);
    }
  }

  getGameName(gameId: string): string {
    const game = this.games.find(g => g.id === gameId);
    return game?.name || 'Jeu inconnu';
  }

  viewSessionDetails(session: GameSession) {
    console.log('Voir détails session:', session);
  }

  getUnlockedAchievementsCount(): number {
    return this.achievements.filter(a => a.isUnlocked).length;
  }

  createSession() {
    if (this.selectedGame) {
      console.log('Créer session:', {
        game: this.selectedGame,
        config: this.sessionConfig
      });
      this.closeCreateSessionModal();
    }
  }

  closeCreateSessionModal() {
    this.showCreateSessionModal = false;
    this.selectedGame = null;
  }
} 