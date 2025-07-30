import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

interface Word {
  word: string;
  found: boolean;
  startPos?: { row: number; col: number };
  endPos?: { row: number; col: number };
}

interface GameState {
  grid: string[][];
  words: Word[];
  score: number;
  timeLeft: number;
  selectedCells: { row: number; col: number }[];
  gameStarted: boolean;
  gameOver: boolean;
  won: boolean;
}

@Component({
  selector: 'app-word-scramble',
  templateUrl: './word-scramble.component.html',
  styleUrls: ['./word-scramble.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class WordScrambleComponent implements OnInit {
  gameState: GameState = {
    grid: [],
    words: [],
    score: 0,
    timeLeft: 300, // 5 minutes
    selectedCells: [],
    gameStarted: false,
    gameOver: false,
    won: false
  };

  private gameTimer: any;
  private isSelecting = false;
  private startCell: { row: number; col: number } | null = null;

  // Thèmes de mots par catégorie
  private wordThemes = {
    'voyage': [
      'AVION', 'HOTEL', 'PASSEPORT', 'VALISE', 'BAGAGE', 'DESTINATION',
      'VOYAGE', 'TOURISME', 'EXCURSION', 'CARTE', 'COMPASS', 'ROUTE'
    ],
    'nourriture': [
      'RESTAURANT', 'CUISINE', 'PLAT', 'DESSERT', 'BOISSON', 'INGREDIENT',
      'RECETTE', 'CHEF', 'SERVICE', 'MENU', 'APERITIF', 'DIGESTIF'
    ],
    'nature': [
      'MONTAGNE', 'FORET', 'OCEAN', 'RIVIERE', 'PLAGE', 'CASCADE',
      'SUNSET', 'AUBE', 'NUAGE', 'VENT', 'PLUIE', 'SOLEIL'
    ]
  };

  ngOnInit() {
    this.initializeGame();
  }

  ngOnDestroy() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
  }

  initializeGame() {
    this.gameState = {
      grid: [],
      words: [],
      score: 0,
      timeLeft: 300,
      selectedCells: [],
      gameStarted: false,
      gameOver: false,
      won: false
    };
    this.generateGrid();
    this.generateWords();
  }

  generateGrid() {
    const size = 12;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.gameState.grid = [];
    
    for (let i = 0; i < size; i++) {
      this.gameState.grid[i] = [];
      for (let j = 0; j < size; j++) {
        this.gameState.grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  generateWords() {
    const theme = 'voyage'; // Pour commencer
    const words = this.wordThemes[theme as keyof typeof this.wordThemes];
    const selectedWords = words.slice(0, 8); // 8 mots à trouver
    
    this.gameState.words = selectedWords.map(word => ({
      word: word,
      found: false
    }));

    // Placer les mots dans la grille
    this.placeWordsInGrid(selectedWords);
  }

  placeWordsInGrid(words: string[]) {
    const directions = [
      { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
      { dr: 0, dc: -1 },                    { dr: 0, dc: 1 },
      { dr: 1, dc: -1 },  { dr: 1, dc: 0 }, { dr: 1, dc: 1 }
    ];

    words.forEach(word => {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const startRow = Math.floor(Math.random() * this.gameState.grid.length);
        const startCol = Math.floor(Math.random() * this.gameState.grid[0].length);
        
        if (this.canPlaceWord(word, startRow, startCol, direction)) {
          this.placeWord(word, startRow, startCol, direction);
          placed = true;
        }
        attempts++;
      }
    });
  }

  canPlaceWord(word: string, startRow: number, startCol: number, direction: { dr: number; dc: number }): boolean {
    const { dr, dc } = direction;
    
    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * dr;
      const col = startCol + i * dc;
      
      if (row < 0 || row >= this.gameState.grid.length || 
          col < 0 || col >= this.gameState.grid[0].length) {
        return false;
      }
      
      const currentLetter = this.gameState.grid[row][col];
      if (currentLetter !== word[i] && currentLetter !== ' ') {
        return false;
      }
    }
    
    return true;
  }

  placeWord(word: string, startRow: number, startCol: number, direction: { dr: number; dc: number }) {
    const { dr, dc } = direction;
    
    for (let i = 0; i < word.length; i++) {
      const row = startRow + i * dr;
      const col = startCol + i * dc;
      this.gameState.grid[row][col] = word[i];
    }
  }

  startGame() {
    this.gameState.gameStarted = true;
    this.startTimer();
  }

  startTimer() {
    this.gameTimer = setInterval(() => {
      this.gameState.timeLeft--;
      if (this.gameState.timeLeft <= 0) {
        this.endGame(false);
      }
    }, 1000);
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    const cell = this.getCellFromEvent(event);
    if (cell) {
      this.isSelecting = true;
      this.startCell = cell;
      this.gameState.selectedCells = [cell];
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isSelecting && this.startCell) {
      const cell = this.getCellFromEvent(event);
      if (cell) {
        this.gameState.selectedCells = this.getCellsBetween(this.startCell, cell);
      }
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (this.isSelecting) {
      this.checkSelectedWord();
      this.isSelecting = false;
      this.startCell = null;
      this.gameState.selectedCells = [];
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    event.preventDefault();
    const cell = this.getCellFromTouchEvent(event);
    if (cell) {
      this.isSelecting = true;
      this.startCell = cell;
      this.gameState.selectedCells = [cell];
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    event.preventDefault();
    if (this.isSelecting && this.startCell) {
      const cell = this.getCellFromTouchEvent(event);
      if (cell) {
        this.gameState.selectedCells = this.getCellsBetween(this.startCell, cell);
      }
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    event.preventDefault();
    if (this.isSelecting) {
      this.checkSelectedWord();
      this.isSelecting = false;
      this.startCell = null;
      this.gameState.selectedCells = [];
    }
  }

  getCellFromEvent(event: MouseEvent): { row: number; col: number } | null {
    const target = event.target as HTMLElement;
    if (target.classList.contains('grid-cell')) {
      const row = parseInt(target.getAttribute('data-row') || '0');
      const col = parseInt(target.getAttribute('data-col') || '0');
      return { row, col };
    }
    return null;
  }

  getCellFromTouchEvent(event: TouchEvent): { row: number; col: number } | null {
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
    if (element && element.classList.contains('grid-cell')) {
      const row = parseInt(element.getAttribute('data-row') || '0');
      const col = parseInt(element.getAttribute('data-col') || '0');
      return { row, col };
    }
    return null;
  }

  getCellsBetween(start: { row: number; col: number }, end: { row: number; col: number }): { row: number; col: number }[] {
    const cells: { row: number; col: number }[] = [];
    const dr = end.row - start.row;
    const dc = end.col - start.col;
    
    if (dr === 0 && dc === 0) {
      return [start];
    }
    
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    const stepDr = dr / steps;
    const stepDc = dc / steps;
    
    for (let i = 0; i <= steps; i++) {
      const row = Math.round(start.row + i * stepDr);
      const col = Math.round(start.col + i * stepDc);
      cells.push({ row, col });
    }
    
    return cells;
  }

  checkSelectedWord() {
    if (this.gameState.selectedCells.length < 3) return;
    
    const word = this.gameState.selectedCells
      .map(cell => this.gameState.grid[cell.row][cell.col])
      .join('');
    
    const reverseWord = word.split('').reverse().join('');
    
    // Vérifier si le mot est dans la liste
    const foundWord = this.gameState.words.find(w => 
      !w.found && (w.word === word || w.word === reverseWord)
    );
    
    if (foundWord) {
      foundWord.found = true;
      foundWord.startPos = this.gameState.selectedCells[0];
      foundWord.endPos = this.gameState.selectedCells[this.gameState.selectedCells.length - 1];
      
      this.gameState.score += word.length * 10;
      
      // Vérifier si tous les mots sont trouvés
      if (this.gameState.words.every(w => w.found)) {
        this.endGame(true);
      }
    }
  }

  endGame(won: boolean) {
    this.gameState.gameOver = true;
    this.gameState.won = won;
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
  }

  restart() {
    this.initializeGame();
  }

  getTimeString(): string {
    const minutes = Math.floor(this.gameState.timeLeft / 60);
    const seconds = this.gameState.timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  isCellSelected(row: number, col: number): boolean {
    return this.gameState.selectedCells.some(cell => cell.row === row && cell.col === col);
  }

  isWordFound(word: Word): boolean {
    return word.found;
  }

  getFoundWordsCount(): number {
    return this.gameState.words.filter(w => w.found).length;
  }

  getTotalWordsCount(): number {
    return this.gameState.words.length;
  }

  // Méthodes trackBy pour optimiser les performances
  trackByRow(index: number, row: string[]): number {
    return index;
  }

  trackByCol(index: number, letter: string): number {
    return index;
  }

  trackByWord(index: number, word: Word): string {
    return word.word;
  }
} 