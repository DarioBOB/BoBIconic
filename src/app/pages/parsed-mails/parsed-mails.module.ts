import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ParsedMailsPageRoutingModule } from './parsed-mails-routing.module';
import { ParsedMailsPage } from './parsed-mails.page';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ParsedMailsPageRoutingModule,
    SharedModule
  ],
  declarations: [ParsedMailsPage]
})
export class ParsedMailsPageModule {} 