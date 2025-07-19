import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private DEFAULT_LANG = environment.defaultLang || 'fr';
  private currentLangSubject = new BehaviorSubject<string>(this.DEFAULT_LANG);
  currentLang$ = this.currentLangSubject.asObservable();

  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('fr');
    this.translate.use('fr');
  }

  setLanguage(lang: string) {
    this.translate.use(lang);
    this.currentLangSubject.next(lang);
  }

  getCurrentLang(): string {
    return this.currentLangSubject.value;
  }

  instant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }
} 