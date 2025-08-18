import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { WindowTabsPage } from './through-my-window/window-tabs.page';
import { WindowTextDataPage } from './through-my-window/window-text-data.page';
import { WindowMapPage } from './through-my-window/window-map.page';
import { WindowHublotPage } from './through-my-window/window-hublot.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WindowTabsPage,
    WindowTextDataPage,
    WindowMapPage,
    WindowHublotPage
  ]
})
export class PagesModule { } 