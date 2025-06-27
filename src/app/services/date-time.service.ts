import { Injectable } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class DateTimeService {

  constructor(private logger: LoggerService) {}

  /**
   * Obtient la date et heure actuelles avec informations de fuseau horaire
   * @returns Objet contenant la date/heure et les infos de fuseau
   */
  getCurrentDateTime() {
    const now = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMinutes = now.getTimezoneOffset();
    
    const result = {
      date: now,
      iso: now.toISOString(),
      utc: now.toUTCString(),
      local: now.toLocaleString(),
      timeZone: timeZone,
      offsetMinutes: offsetMinutes,
      offsetHours: offsetMinutes / -60, // Positif pour UTC+
      localISO: new Date(now.getTime() - (offsetMinutes * 60000)).toISOString()
    };

    this.logger.debug('DateTime', 'Date/heure actuelle obtenue', result);
    return result;
  }

  /**
   * Obtient la date/heure actuelle formatée pour l'affichage
   * @param locale Locale pour le formatage (ex: 'fr-FR', 'en-US')
   * @returns Date/heure formatée
   */
  getFormattedCurrentDateTime(locale: string = 'fr-FR') {
    const now = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return now.toLocaleString(locale, { 
      timeZone: timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Compare une date avec la date actuelle
   * @param date Date à comparer
   * @returns Différence en millisecondes (positive si la date est dans le futur)
   */
  compareWithCurrentDate(date: Date | string) {
    const current = this.getCurrentDateTime();
    const compareDate = new Date(date);
    const diffMs = compareDate.getTime() - current.date.getTime();
    
    this.logger.debug('DateTime', 'Comparaison de dates', {
      current: current.iso,
      compare: compareDate.toISOString(),
      diffMs: diffMs,
      diffHours: diffMs / (1000 * 60 * 60)
    });
    
    return diffMs;
  }

  /**
   * Vérifie si une date est dans le passé, présent ou futur
   * @param date Date à vérifier
   * @param toleranceMs Tolérance en ms pour considérer "présent" (défaut: 1 heure)
   * @returns 'past', 'present', ou 'future'
   */
  getDateStatus(date: Date | string, toleranceMs: number = 60 * 60 * 1000) {
    const diffMs = this.compareWithCurrentDate(date);
    
    if (Math.abs(diffMs) <= toleranceMs) {
      return 'present';
    } else if (diffMs > 0) {
      return 'future';
    } else {
      return 'past';
    }
  }

  /**
   * Calcule le décalage entre deux dates en tenant compte du fuseau horaire
   * @param date1 Première date
   * @param date2 Deuxième date
   * @returns Décalage en millisecondes
   */
  calculateDateOffset(date1: Date | string, date2: Date | string) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const offset = d2.getTime() - d1.getTime();
    
    this.logger.debug('DateTime', 'Calcul de décalage entre dates', {
      date1: d1.toISOString(),
      date2: d2.toISOString(),
      offsetMs: offset,
      offsetHours: offset / (1000 * 60 * 60)
    });
    
    return offset;
  }
} 