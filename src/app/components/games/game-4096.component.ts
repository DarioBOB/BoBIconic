import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-game-4096',
  templateUrl: './game-4096.component.html',
  styleUrls: ['./game-4096.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class Game4096Component implements OnInit {
  board: number[][] = [];
  size = 4;
  score = 0;
  bestScore = 0;
  gameOver = false;
  won = false;
  target = 4096;

  ngOnInit() {
    console.log('Game4096Component ngOnInit');
    this.loadBestScore();
    this.initBoard();
    console.log('Board after init:', this.board);
  }

  initBoard() {
    console.log('Initializing board...');
    this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    this.addRandomTile();
    this.addRandomTile();
    console.log('Board initialized:', this.board);
  }

  addRandomTile() {
    const empty = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  move(direction: string) {
    if (this.gameOver) return;

    let moved = false;
    const original = JSON.stringify(this.board);

    for (let i = 0; i < this.size; i++) {
      let line = this.getLine(i, direction);
      let merged = this.merge(line);
      this.setLine(i, direction, merged);
    }

    if (JSON.stringify(this.board) !== original) {
      this.addRandomTile();
      this.checkGameState();
    }
  }

  getLine(i: number, dir: string): number[] {
    const line: number[] = [];
    for (let j = 0; j < this.size; j++) {
      if (dir === 'left') line.push(this.board[i][j]);
      else if (dir === 'right') line.push(this.board[i][this.size - 1 - j]);
      else if (dir === 'up') line.push(this.board[j][i]);
      else if (dir === 'down') line.push(this.board[this.size - 1 - j][i]);
    }
    return line;
  }

  setLine(i: number, dir: string, line: number[]) {
    for (let j = 0; j < this.size; j++) {
      if (dir === 'left') this.board[i][j] = line[j];
      else if (dir === 'right') this.board[i][this.size - 1 - j] = line[j];
      else if (dir === 'up') this.board[j][i] = line[j];
      else if (dir === 'down') this.board[this.size - 1 - j][i] = line[j];
    }
  }

  merge(line: number[]): number[] {
    const filtered = line.filter(n => n !== 0);
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        this.score += filtered[i];
        filtered[i + 1] = 0;
      }
    }
    const merged = filtered.filter(n => n !== 0);
    while (merged.length < this.size) merged.push(0);
    return merged;
  }

  checkGameState() {
    // Vérifier si le joueur a gagné
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] >= this.target && !this.won) {
          this.won = true;
        }
      }
    }

    // Vérifier si le jeu est terminé
    if (this.isGameOver()) {
      this.gameOver = true;
    }

    // Mettre à jour le meilleur score
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.saveBestScore();
    }
  }

  isGameOver(): boolean {
    // Vérifier s'il y a des cases vides
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === 0) return false;
      }
    }

    // Vérifier s'il y a des fusions possibles
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const current = this.board[r][c];
        // Vérifier à droite
        if (c < this.size - 1 && this.board[r][c + 1] === current) return false;
        // Vérifier en bas
        if (r < this.size - 1 && this.board[r + 1][c] === current) return false;
      }
    }

    return true;
  }

  @HostListener('document:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') this.move('left');
    else if (event.key === 'ArrowRight') this.move('right');
    else if (event.key === 'ArrowUp') this.move('up');
    else if (event.key === 'ArrowDown') this.move('down');
  }

  onSwipe(event: any) {
    const direction = event.direction;
    if (direction === 2) this.move('left');   // Swipe left
    else if (direction === 4) this.move('right'); // Swipe right
    else if (direction === 8) this.move('up');    // Swipe up
    else if (direction === 16) this.move('down'); // Swipe down
  }

  restart() {
    this.initBoard();
  }

  continueGame() {
    this.won = false;
  }

  private loadBestScore() {
    const saved = localStorage.getItem('game4096-best-score');
    this.bestScore = saved ? parseInt(saved) : 0;
  }

  private saveBestScore() {
    localStorage.setItem('game4096-best-score', this.bestScore.toString());
  }

  getTileClass(value: number): string {
    if (value === 0) return 'tile tile-empty';
    return `tile tile-${value}`;
  }

  isNewTile(row: number, col: number): boolean {
    // Pour l'instant, retourne false - à implémenter avec un système de tracking
    return false;
  }

  isMergedTile(row: number, col: number): boolean {
    // Pour l'instant, retourne false - à implémenter avec un système de tracking
    return false;
  }

  getFlattenedBoard(): number[] {
    return this.board.flat();
  }
} 