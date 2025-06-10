import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-window-tabs',
  templateUrl: './window-tabs.page.html',
  styleUrls: ['./window-tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class WindowTabsPage {} 