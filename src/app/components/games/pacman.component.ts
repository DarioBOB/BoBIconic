import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  grid: string[][];
  pacman: Position;
  ghost: Position;
  score: number;
  gameOver: boolean;
  won: boolean;
  dotsRemaining: number;
}

@Component({
  selector: 'app-pacman',
  templateUrl: './pacman.component.html',
  styleUrls: ['./pacman.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class PacmanComponent implements OnInit {
  gameState: GameState = {
    grid: [],
    pacman: { x: 1, y: 1 },
    ghost: { x: 5, y: 5 },
    score: 0,
    gameOver: false,
    won: false,
    dotsRemaining: 0
  };

  private gameInterval: any;
  private ghostSpeed = 500; // ms entre chaque mouvement du fantôme

  ngOnInit() {
    this.initGame();
  }

  ngOnDestroy() {
    this.clearGameInterval();
  }

  initGame() {
    this.gameState = {
      grid: [],
      pacman: { x: 1, y: 1 },
      ghost: { x: 5, y: 5 },
      score: 0,
      gameOver: false,
      won: false,
      dotsRemaining: 0
    };
    this.initGrid();
    this.startGhostMovement();
  }

  initGrid() {
    // Labyrinthe Pac-Man classique
    const layout = [
      'WWWWWWWWWWWWWWWWWWWW',
      'W........WW........W',
      'W.WW.WWW.WW.WWW.WW.W',
      'W.WW.WWW.WW.WWW.WW.W',
      'W.WW.WWW.WW.WWW.WW.W',
      'W...................W',
      'W.WW.WW.WWWWW.WW.WW.W',
      'W.WW.WW.WWWWW.WW.WW.W',
      'W....WW....W....WW..W',
      'WWWW.WWWW W WWWW.WWWW',
      '   W.WWWW W WWWW.W   ',
      '   W.WW       WW.W   ',
      '   W.WW WW-WW WW.W   ',
      'WWWW.WW W   W WW.WWWW',
      '    .   W   W   .    ',
      'WWWW.WW W   W WW.WWWW',
      '   W.WW WWWWW WW.W   ',
      '   W.WW       WW.W   ',
      '   W.WW WWWWW WW.W   ',
      'WWWW.WW WWWWW WW.WWWW',
      'W........WW........W',
      'W.WW.WWW.WW.WWW.WW.W',
      'W.WW.WWW.WW.WWW.WW.W',
      'W..WW....W....WW..W',
      'WW.WW.WW.WWW.WW.WW.WW',
      'WW.WW.WW.WWW.WW.WW.WW',
      'W........WW........W',
      'WWWWWWWWWWWWWWWWWWWW'
    ];

    this.gameState.grid = layout.map(row => row.split(''));
    this.countDots();
    this.placeCharacters();
  }

  countDots() {
    this.gameState.dotsRemaining = 0;
    for (let row of this.gameState.grid) {
      for (let cell of row) {
        if (cell === '.') {
          this.gameState.dotsRemaining++;
        }
      }
    }
  }

  placeCharacters() {
    // Placer Pac-Man
    this.gameState.grid[this.gameState.pacman.y][this.gameState.pacman.x] = 'P';
    
    // Placer le fantôme
    this.gameState.grid[this.gameState.ghost.y][this.gameState.ghost.x] = 'G';
  }

  startGhostMovement() {
    this.gameInterval = setInterval(() => {
      if (!this.gameState.gameOver && !this.gameState.won) {
        this.moveGhost();
      }
    }, this.ghostSpeed);
  }

  clearGameInterval() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
  }

  move(dx: number, dy: number) {
    if (this.gameState.gameOver || this.gameState.won) return;

    const newX = this.gameState.pacman.x + dx;
    const newY = this.gameState.pacman.y + dy;

    // Vérifier les limites et les murs
    if (newY < 0 || newY >= this.gameState.grid.length || 
        newX < 0 || newX >= this.gameState.grid[0].length ||
        this.gameState.grid[newY][newX] === 'W') {
      return;
    }

    // Effacer l'ancienne position de Pac-Man
    this.gameState.grid[this.gameState.pacman.y][this.gameState.pacman.x] = ' ';

    // Mettre à jour la position
    this.gameState.pacman.x = newX;
    this.gameState.pacman.y = newY;

    // Vérifier si Pac-Man mange une pastille
    if (this.gameState.grid[newY][newX] === '.') {
      this.gameState.score += 10;
      this.gameState.dotsRemaining--;
      
      // Vérifier si le jeu est gagné
      if (this.gameState.dotsRemaining === 0) {
        this.endGame(true);
        return;
      }
    }

    // Placer Pac-Man à sa nouvelle position
    this.gameState.grid[newY][newX] = 'P';

    // Vérifier la collision avec le fantôme
    this.checkCollision();
  }

  moveGhost() {
    if (this.gameState.gameOver || this.gameState.won) return;

    // IA simple : le fantôme se dirige vers Pac-Man
    const dx = this.gameState.pacman.x > this.gameState.ghost.x ? 1 : 
               this.gameState.pacman.x < this.gameState.ghost.x ? -1 : 0;
    const dy = this.gameState.pacman.y > this.gameState.ghost.y ? 1 : 
               this.gameState.pacman.y < this.gameState.ghost.y ? -1 : 0;

    // Priorité au mouvement horizontal si possible
    let nextX = this.gameState.ghost.x;
    let nextY = this.gameState.ghost.y;

    if (dx !== 0 && this.isValidMove(this.gameState.ghost.x + dx, this.gameState.ghost.y)) {
      nextX = this.gameState.ghost.x + dx;
    } else if (dy !== 0 && this.isValidMove(this.gameState.ghost.x, this.gameState.ghost.y + dy)) {
      nextY = this.gameState.ghost.y + dy;
    }

    // Effacer l'ancienne position du fantôme
    this.gameState.grid[this.gameState.ghost.y][this.gameState.ghost.x] = ' ';

    // Mettre à jour la position du fantôme
    this.gameState.ghost.x = nextX;
    this.gameState.ghost.y = nextY;

    // Placer le fantôme à sa nouvelle position
    this.gameState.grid[nextY][nextX] = 'G';

    // Vérifier la collision
    this.checkCollision();
  }

  isValidMove(x: number, y: number): boolean {
    return y >= 0 && y < this.gameState.grid.length && 
           x >= 0 && x < this.gameState.grid[0].length && 
           this.gameState.grid[y][x] !== 'W';
  }

  checkCollision() {
    if (this.gameState.pacman.x === this.gameState.ghost.x && 
        this.gameState.pacman.y === this.gameState.ghost.y) {
      this.endGame(false);
    }
  }

  endGame(won: boolean) {
    this.gameState.gameOver = true;
    this.gameState.won = won;
    this.clearGameInterval();
    
    setTimeout(() => {
      if (won) {
        alert(`🎉 Victoire ! Score: ${this.gameState.score}`);
      } else {
        alert(`💀 Game Over ! Score: ${this.gameState.score}`);
      }
    }, 100);
  }

  restart() {
    this.clearGameInterval();
    this.initGame();
  }

  @HostListener('document:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowUp':
        this.move(0, -1);
        break;
      case 'ArrowDown':
        this.move(0, 1);
        break;
      case 'ArrowLeft':
        this.move(-1, 0);
        break;
      case 'ArrowRight':
        this.move(1, 0);
        break;
      case ' ':
        event.preventDefault();
        this.restart();
        break;
    }
  }

  // Méthodes utilitaires pour le template
  getCellClass(cell: string): string {
    switch (cell) {
      case 'W': return 'wall';
      case '.': return 'dot';
      case 'P': return 'pacman';
      case 'G': return 'ghost';
      default: return 'empty';
    }
  }

  getCellContent(cell: string): string {
    switch (cell) {
      case '.': return '•';
      case 'P': return '😀';
      case 'G': return '👻';
      default: return '';
    }
  }
} 