import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { DemoService } from '../services/demo.service';
import { TranslatePipe } from '../pipes/translate.pipe';

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  imports: [CommonModule, IonicModule, TranslatePipe],
  template: `
    <div *ngIf="isDemo" class="demo-banner-global">
      <ion-icon name="information-circle-outline"></ion-icon>
      <span>{{ 'COMMON.DEMO_MODE' | translate }}</span>
    </div>
  `,
  styles: [`
    .demo-banner-global {
      width: 100vw;
      background: #ffd700;
      color: #222;
      text-align: center;
      font-weight: 600;
      font-size: 1.1em;
      padding: 6px 0 6px 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 2px 4px #0002;
    }
    ion-icon {
      font-size: 1.2em;
      margin-right: 6px;
    }
  `]
})
export class DemoBannerComponent implements OnInit {
  isDemo = false;
  constructor(private demoService: DemoService) {}
  ngOnInit() {
    this.isDemo = this.demoService.isDemoMode();
  }
} 