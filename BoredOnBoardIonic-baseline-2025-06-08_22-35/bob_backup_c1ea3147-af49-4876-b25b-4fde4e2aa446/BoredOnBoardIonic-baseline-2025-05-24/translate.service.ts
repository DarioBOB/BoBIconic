import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LanguageService, Language } from './language.service';
import { HttpClient } from '@angular/common/http';

interface Translations {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private translations: Translations = {};
  private currentLang = new BehaviorSubject<Language>('fr');
  private loadedLangs: Set<Language> = new Set();

  constructor(private languageService: LanguageService, private http: HttpClient) {
    console.log('[TRANSLATE SERVICE] Constructor called');
    this.languageService.currentLang$.subscribe(lang => {
      console.log(`[TRANSLATE SERVICE] Language changed: ${lang}`);
      this.currentLang.next(lang);
      this.loadTranslations(lang, true);
    });
  }

  private loadTranslations(lang: Language, force = false) {
    if (this.loadedLangs.has(lang) && !force) {
      console.log(`[TRANSLATE SERVICE] Translations for '${lang}' already loaded.`);
      return;
    }
    console.log(`[TRANSLATE SERVICE] Loading translations for '${lang}'...`);
    this.http.get(`/assets/i18n/${lang}.json`).subscribe({
      next: (data) => {
        console.log(`[TRANSLATE SERVICE] Loaded translations for '${lang}':`, data);
        this.translations[lang] = data;
        this.loadedLangs.add(lang);
      },
      error: (err) => {
        console.error(`[TRANSLATE SERVICE] Failed to load ${lang}.json`, err);
      }
    });
  }

  translate(key: string): string {
    const lang = this.currentLang.value;
    console.log(`[TRANSLATE SERVICE] translate() called for key: ${key}, lang: ${lang}`);
    if (!this.translations[lang]) {
      console.warn(`[TRANSLATE SERVICE] Translations for '${lang}' not loaded yet, returning key: ${key}`);
      return key;
    }
    const keys = key.split('.');
    let value: any = this.translations[lang] || this.translations['fr'];
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`[TRANSLATE SERVICE] Key not found: ${key}`);
        return key;
      }
    }
    return typeof value === 'string' ? value : key;
  }

  use(lang: Language) {
    this.languageService.setLanguage(lang);
    this.loadTranslations(lang, true);
  }
} 