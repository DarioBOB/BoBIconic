import { Injectable } from '@angular/core';
import { POI } from './poi.service';

@Injectable({
  providedIn: 'root'
})
export class POIIconService {
  private readonly POI_ICONS: Record<POI['type'], string> = {
    montagne: 'assets/icons/poi/montagne.png',
    ville: 'assets/icons/poi/ville.png',
    eau: 'assets/icons/poi/eau.png',
    historique: 'assets/icons/poi/historique.png',
    nature: 'assets/icons/poi/nature.png',
    parc: 'assets/icons/poi/parc.png',
    plage: 'assets/icons/poi/plage.png',
    vallee: 'assets/icons/poi/vallee.png',
    archipel: 'assets/icons/poi/archipel.png',
    port: 'assets/icons/poi/port.png',
    quartier: 'assets/icons/poi/quartier.png',
    colline: 'assets/icons/poi/colline.png',
    autre: 'assets/icons/poi/default.png'
  };

  getIconForType(type: POI['type']): string {
    return this.POI_ICONS[type] || this.POI_ICONS['autre'];
  }

  getIconSize(type: POI['type']): { width: number; height: number } {
    switch (type) {
      case 'montagne':
      case 'ville':
      case 'historique':
        return { width: 32, height: 32 };
      case 'eau':
      case 'nature':
      case 'parc':
      case 'plage':
      case 'vallee':
      case 'archipel':
      case 'port':
      case 'quartier':
      case 'colline':
        return { width: 24, height: 24 };
      default:
        return { width: 20, height: 20 };
    }
  }

  getIconAnchor(type: POI['type']): { x: number; y: number } {
    const size = this.getIconSize(type);
    return {
      x: size.width / 2,
      y: size.height
    };
  }
} 