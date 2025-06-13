import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

export interface TripPlan {
  title: string;
  icon: string;
  description: string;
  time: string;
}

@Component({
  selector: 'app-serpentin-timeline',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './serpentin-timeline.page.html',
  styleUrls: ['./serpentin-timeline.page.scss']
})
export class SerpentinTimelinePage implements AfterViewInit {
  // 🔄 TODO: Remplacer par Firestore plus tard
  plans: TripPlan[] = [
    {
      title: 'Flight: Geneva → Brussels',
      icon: 'airplane-outline',
      description: 'EasyJet EZS1529 – Terminal 1',
      time: 'June 5, 14:10'
    },
    {
      title: 'Car Rental',
      icon: 'car-outline',
      description: 'Thrifty – Ford Focus',
      time: 'June 5, 16:00'
    },
    {
      title: 'Hotel Stay',
      icon: 'home-outline',
      description: 'Ibis Brussels Centre',
      time: 'June 5–10'
    },
    {
      title: 'Guided City Tour',
      icon: 'camera-outline',
      description: 'Brussels Highlights – Grand-Place',
      time: 'June 7, 11:00'
    }
  ];

  @ViewChild('serpentinPath', { static: false, read: ElementRef }) pathRef!: ElementRef;
  stepPositions: { iconX: number, iconY: number, labelX: number, labelY: number, side: number }[] = [];

  ngAfterViewInit() {
    setTimeout(() => this.computeStepPositions(), 0);
  }

  computeStepPositions() {
    const svg: SVGSVGElement | null = document.querySelector('.serpentin-svg');
    const path: SVGPathElement | null = svg?.querySelector('#serpentinPath') || null;
    if (!path) return;
    const totalLength = path.getTotalLength();
    const n = this.plans.length;
    this.stepPositions = this.plans.map((_, i) => {
      // Espacement vertical harmonieux
      const t = (i + 1) / (n + 1);
      const pos = path.getPointAtLength(t * totalLength);
      // Icône centrée sur la route
      const iconX = pos.x;
      const iconY = pos.y;
      // Texte à côté, jamais sur la route
      const side = i % 2 === 0 ? -1 : 1;
      const labelX = iconX + 80 * side;
      const labelY = iconY - 24; // aligné verticalement avec l'icône
      return { iconX, iconY, labelX, labelY, side };
    });
  }

  getStepStyle(i: number) {
    if (!this.stepPositions[i]) return {};
    // Place le conteneur à la position de l'icône, le texte est en flex à côté
    return {
      left: `calc(${this.stepPositions[i].iconX - 32}px)`,
      top: `calc(${this.stepPositions[i].iconY - 32}px)`
    };
  }

  getAttachLine(i: number) {
    if (!this.stepPositions[i]) return '';
    // Attache courte et courbée, partant du bord de la bulle
    const side = this.stepPositions[i].side;
    const x1 = this.stepPositions[i].iconX + 13 * side; // pastille
    const y1 = this.stepPositions[i].iconY;
    const x2 = this.stepPositions[i].iconX + 55 * side; // bord bulle
    const y2 = this.stepPositions[i].iconY - 10;
    return `M${x1},${y1} Q${x1 + 18 * side},${y1 - 10} ${x2},${y2}`;
  }

  getDotStyle(i: number) {
    if (!this.stepPositions[i]) return {};
    return {
      left: `calc(${this.stepPositions[i].iconX - 6}px)` ,
      top: `calc(${this.stepPositions[i].iconY - 6}px)`
    };
  }

  getBadgeColor(icon: string): string {
    switch (icon) {
      case 'airplane-outline': return 'linear-gradient(135deg, #ff9800 60%, #2196f3 100%)';
      case 'car-outline': return 'linear-gradient(135deg, #ffa726 60%, #66bb6a 100%)';
      case 'home-outline': return 'linear-gradient(135deg, #66bb6a 60%, #29b6f6 100%)';
      case 'camera-outline': return 'linear-gradient(135deg, #29b6f6 60%, #ab47bc 100%)';
      default: return 'linear-gradient(135deg, #bdbdbd 60%, #90caf9 100%)';
    }
  }
} 