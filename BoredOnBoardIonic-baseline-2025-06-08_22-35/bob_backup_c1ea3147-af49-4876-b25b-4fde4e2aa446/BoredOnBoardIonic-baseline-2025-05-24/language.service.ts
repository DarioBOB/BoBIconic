import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Language = 'fr' | 'en';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLang = new BehaviorSubject<Language>('fr');
  currentLang$ = this.currentLang.asObservable();

  constructor() {
    // Détecter la langue du navigateur
    const browserLang = navigator.language.split('-')[0];
    this.setLanguage(browserLang as Language || 'fr');
  }

  setLanguage(lang: Language) {
    this.currentLang.next(lang);
    document.documentElement.lang = lang;
    localStorage.setItem('preferredLanguage', lang);
  }

  getCurrentLanguage(): Language {
    return this.currentLang.value;
  }
} 