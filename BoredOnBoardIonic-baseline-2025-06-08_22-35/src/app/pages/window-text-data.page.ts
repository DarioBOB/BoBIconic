import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-window-text-data',
  standalone: true,
  imports: [IonicModule, CommonModule],
  template: `
    <div *ngIf="isLoadingData" class="spinner-container">
      <ion-spinner name="crescent"></ion-spinner>
      <div>Chargement des données textuelles…</div>
    </div>
    <div *ngIf="!isLoadingData">
      <!-- Contenu de la page -->
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 60vh;
      font-size: 1.2em;
      color: #888;
    }
  `]
})
export class WindowTextDataPage implements OnInit {
  isLoadingData = true;

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoadingData = true;
    // ... chargement asynchrone ...
    this.isLoadingData = false;
  }
} 