import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Game4096Component } from '../components/games/game-4096.component';

@Component({
  selector: 'app-game-4096-page',
  template: '<app-game-4096></app-game-4096>',
  standalone: true,
  imports: [IonicModule, CommonModule, Game4096Component]
})
export class Game4096Page {
  constructor() {}
} 