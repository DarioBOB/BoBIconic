import { Injectable } from '@angular/core';
import { TranslateService as NgxTranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class TranslateService {
  constructor(private ngxTranslate: NgxTranslateService) {
    // Set default language
    const savedLang = localStorage.getItem('lang') || 'fr';
    this.ngxTranslate.setDefaultLang('fr');
    this.ngxTranslate.use(savedLang);
  }

  use(lang: 'fr' | 'en') {
    this.ngxTranslate.use(lang);
    localStorage.setItem('lang', lang);
  }

  get(key: string) {
    return this.ngxTranslate.get(key);
  }
} 