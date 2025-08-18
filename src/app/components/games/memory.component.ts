import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
  isLocked: boolean;
}

interface GameState {
  cards: Card[];
  flippedCards: Card[];
  score: number;
  moves: number;
  timeElapsed: number;
  gameStarted: boolean;
  gameOver: boolean;
  won: boolean;
  bestScore: number;
  bestTime: number;
}

@Component({
  selector: 'app-memory',
  templateUrl: './memory.component.html',
  styleUrls: ['./memory.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MemoryComponent implements OnInit {
  gameState: GameState = {
    cards: [],
    flippedCards: [],
    score: 0,
    moves: 0,
    timeElapsed: 0,
    gameStarted: false,
    gameOver: false,
    won: false,
    bestScore: 0,
    bestTime: 0
  };

  private gameTimer: any;
  private cardPairs = 8; // 16 cartes total (8 paires)
  private cardValues = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'];

  ngOnInit() {
    this.initializeGame();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  initializeGame() {
    this.gameState = {
      cards: [],
      flippedCards: [],
      score: 0,
      moves: 0,
      timeElapsed: 0,
      gameStarted: false,
      gameOver: false,
      won: false,
      bestScore: this.gameState.bestScore,
      bestTime: this.gameState.bestTime
    };
    this.generateCards();
  }

  generateCards() {
    const selectedValues = this.cardValues.slice(0, this.cardPairs);
    const cardPairs = [...selectedValues, ...selectedValues];
    
    // Mélanger les cartes
    for (let i = cardPairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
    }

    this.gameState.cards = cardPairs.map((value, index) => ({
      id: index,
      value: value,
      isFlipped: false,
      isMatched: false,
      isLocked: false
    }));
  }

  startGame() {
    this.gameState.gameStarted = true;
    this.startTimer();
  }

  startTimer() {
    this.gameTimer = setInterval(() => {
      this.gameState.timeElapsed++;
    }, 1000);
  }

  flipCard(card: Card) {
    if (!this.gameState.gameStarted || this.gameState.gameOver) {
      if (!this.gameState.gameStarted) {
        this.startGame();
      }
      return;
    }

    if (card.isFlipped || card.isMatched || card.isLocked) {
      return;
    }

    // Retourner la carte
    card.isFlipped = true;
    this.gameState.flippedCards.push(card);

    // Si c'est la deuxième carte retournée
    if (this.gameState.flippedCards.length === 2) {
      this.gameState.moves++;
      this.checkMatch();
    }
  }

  checkMatch() {
    const [card1, card2] = this.gameState.flippedCards;
    
    if (card1.value === card2.value) {
      // Match trouvé !
      card1.isMatched = true;
      card2.isMatched = true;
      this.gameState.score += 100;
      
      // Bonus de temps
      const timeBonus = Math.max(0, 30 - this.gameState.timeElapsed);
      this.gameState.score += timeBonus;
      
      this.gameState.flippedCards = [];
      
      // Vérifier si le jeu est terminé
      if (this.gameState.cards.every(card => card.isMatched)) {
        this.endGame(true);
      }
    } else {
      // Pas de match, retourner les cartes après un délai
      setTimeout(() => {
        card1.isFlipped = false;
        card2.isFlipped = false;
        this.gameState.flippedCards = [];
      }, 1000);
    }
  }

  endGame(won: boolean) {
    this.gameState.gameOver = true;
    this.gameState.won = won;
    this.clearTimer();
    
    if (won) {
      // Mettre à jour les meilleurs scores
      if (this.gameState.score > this.gameState.bestScore) {
        this.gameState.bestScore = this.gameState.score;
      }
      
      if (this.gameState.bestTime === 0 || this.gameState.timeElapsed < this.gameState.bestTime) {
        this.gameState.bestTime = this.gameState.timeElapsed;
      }
    }
  }

  restart() {
    this.clearTimer();
    this.initializeGame();
  }

  clearTimer() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
  }

  getTimeString(): string {
    const minutes = Math.floor(this.gameState.timeElapsed / 60);
    const seconds = this.gameState.timeElapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getBestTimeString(): string {
    if (this.gameState.bestTime === 0) return '--:--';
    const minutes = Math.floor(this.gameState.bestTime / 60);
    const seconds = this.gameState.bestTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getMatchedPairsCount(): number {
    return this.gameState.cards.filter(card => card.isMatched).length / 2;
  }

  getTotalPairsCount(): number {
    return this.cardPairs;
  }

  getProgressPercentage(): number {
    return (this.getMatchedPairsCount() / this.getTotalPairsCount()) * 100;
  }

  getPerformanceMessage(): string {
    const moves = this.gameState.moves;
    const time = this.gameState.timeElapsed;
    
    if (moves <= 12 && time <= 60) return 'Parfait ! 🏆';
    if (moves <= 16 && time <= 90) return 'Excellent ! ⭐';
    if (moves <= 20 && time <= 120) return 'Très bien ! 👍';
    if (moves <= 24 && time <= 150) return 'Bien joué ! 😊';
    return 'Continuez à vous entraîner ! 💪';
  }

  getCardClass(card: Card): string {
    let classes = 'memory-card';
    
    if (card.isFlipped || card.isMatched) {
      classes += ' flipped';
    }
    
    if (card.isMatched) {
      classes += ' matched';
    }
    
    if (this.gameState.flippedCards.includes(card)) {
      classes += ' selected';
    }
    
    return classes;
  }

  isCardLocked(card: Card): boolean {
    return card.isLocked || this.gameState.flippedCards.length >= 2;
  }

  // Méthode trackBy pour optimiser les performances
  trackByCard(index: number, card: Card): number {
    return card.id;
  }
} 