import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-window',
  standalone: true,
  imports: [IonicModule],
  template: `
    <ion-content>
      <div style="display: flex; justify-content: center; align-items: center; height: 80vh;">
        <h2 style="color: #1976d2; font-weight: 600;">Carte (Ma Fenêtre)</h2>
      </div>
    </ion-content>
  `
})
export class WindowPage {} 