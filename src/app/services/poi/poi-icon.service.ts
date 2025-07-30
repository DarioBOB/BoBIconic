import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class POIIconService {

  private readonly icons: { [key: string]: string } = {
    montagne: '🏔️',
    ville: '🏙️',
    historique: '🏛️',
    eau: '💧',
    parc: '🌲',
    plage: '🏖️',
    vallee: '🏞️',
    archipel: '🏝️',
    port: '⚓',
    quartier: '🏘️',
    colline: '⛰️',
    nature: '🌿',
    autre: '📍'
  };

  private readonly colors: { [key: string]: string } = {
    montagne: '#8B4513',
    ville: '#4169E1',
    historique: '#FFD700',
    eau: '#00BFFF',
    parc: '#228B22',
    plage: '#F4A460',
    vallee: '#32CD32',
    archipel: '#20B2AA',
    port: '#4682B4',
    quartier: '#9370DB',
    colline: '#A0522D',
    nature: '#90EE90',
    autre: '#808080'
  };

  getIcon(type: string): string {
    return this.icons[type] || this.icons['autre'];
  }

  getColor(type: string): string {
    return this.colors[type] || this.colors['autre'];
  }

  getColorForVisibility(type: string, isVisible: boolean): string {
    const baseColor = this.getColor(type);
    return isVisible ? baseColor : '#666';
  }

  getAllTypes(): string[] {
    return Object.keys(this.icons).filter(key => key !== 'autre');
  }
} 