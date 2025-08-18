// src/app/trips2/services/timezone-converter-service-gemini-generated.ts

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimezoneConverterServiceGeminiGenerated {

  constructor() { }

  /**
   * Ajuste la valeur UTC interne d'un objet Date afin que ses méthodes locales (comme getHours(), getDate())
   * reflètent l'heure dans le fuseau horaire spécifié, lorsqu'elles sont appelées depuis le système local.
   * Ceci est une solution de contournement pour ne pas utiliser une bibliothèque de fuseaux horaires complète.
   *
   * @param date L'objet Date à ajuster.
   * @param timezone La chaîne du fuseau horaire cible (par exemple, 'Europe/Paris').
   * @returns Un NOUVEL objet Date dont la valeur UTC interne est ajustée.
   */
  convertToLocal(date: Date, timezone: string): Date {
    // Obtient la chaîne de l'heure locale dans le fuseau horaire cible pour l'objet Date donné.
    // Utilise 'en-US' pour un formatage standard et hourCycle: 'h23' pour le format 24h.
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hourCycle: 'h23', // Format 24 heures pour une interprétation cohérente
        timeZone: timezone
    };
    const dateStringInTargetTimezone = date.toLocaleString('en-US', options);

    // Crée un nouvel objet Date à partir de cette chaîne.
    // Le constructeur Date qui analyse une chaîne l'interprétera dans le fuseau horaire local du *système*.
    // Cela décale efficacement la valeur UTC interne pour qu'elle corresponde à l'heure locale souhaitée
    // dans le fuseau horaire cible lorsque les méthodes getHours(), etc. sont appelées.
    return new Date(dateStringInTargetTimezone);
  }
}
