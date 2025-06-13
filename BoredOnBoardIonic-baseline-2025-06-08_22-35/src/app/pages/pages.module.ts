import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { WindowTabsPage } from './window-tabs.page';
import { WindowTextDataPage } from './window-text-data.page';
import { WindowMapPage } from './window-map.page';
import { WindowHublotPage } from './window-hublot.page';

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