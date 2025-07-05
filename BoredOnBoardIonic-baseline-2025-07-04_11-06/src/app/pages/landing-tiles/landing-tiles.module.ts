import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LandingTilesPage } from './landing-tiles.page';
import { UserStatusBarComponent } from '../../components/user-status-bar/user-status-bar.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: LandingTilesPage
      }
    ]),
    TranslateModule,
    UserStatusBarComponent,
    LandingTilesPage
  ]
})
export class LandingTilesPageModule {} 