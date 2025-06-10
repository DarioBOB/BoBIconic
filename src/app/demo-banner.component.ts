import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-demo-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isDemoMode" class="demo-banner">
      <span class="demo-icon">🧪</span>
      <span class="demo-text">Mode démo activé : toutes les données sont fictives.</span>
      <button class="demo-exit-btn" (click)="exitDemo()">Quitter le mode démo</button>
    </div>
  `,
  styles: [`
    .demo-banner {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      z-index: 9999;
      background: #ffe066;
      color: #333;
      font-weight: 600;
      font-size: 1.05rem;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 0 10px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      gap: 16px;
      border-bottom: 2px solid #ffd700;
      animation: demoBannerFadeIn 0.4s;
    }
    .demo-icon {
      font-size: 1.4em;
      margin-right: 8px;
    }
    .demo-exit-btn {
      margin-left: 24px;
      background: #ffd700;
      color: #333;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .demo-exit-btn:hover {
      background: #ffe066;
      text-decoration: underline;
    }
    @keyframes demoBannerFadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class DemoBannerComponent implements OnInit, OnDestroy {
  isDemoMode = false;
  private storageListener = () => {
    this.isDemoMode = localStorage.getItem('demo_mode') === 'true';
    this.cdr.detectChanges();
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    this.isDemoMode = localStorage.getItem('demo_mode') === 'true';
    window.addEventListener('storage', this.storageListener);
  }

  ngOnDestroy() {
    window.removeEventListener('storage', this.storageListener);
  }

  async exitDemo() {
    localStorage.removeItem('demo_mode');
    this.isDemoMode = false;
    this.cdr.detectChanges();
    try {
      await signOut(this.auth);
    } catch (e) {}
    this.router.navigate(['/auth/email']);
  }
}