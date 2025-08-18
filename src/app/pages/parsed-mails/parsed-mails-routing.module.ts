import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ParsedMailsPage } from './parsed-mails.page';

const routes: Routes = [
  {
    path: '',
    component: ParsedMailsPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ParsedMailsPageRoutingModule {} 