import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoggerService, LogLevel, LogEntry } from '../../services/logger.service';
import { Subscription } from 'rxjs';

// Interface étendue pour inclure showContext
interface LogEntryWithUI extends LogEntry {
  showContext?: boolean;
}

@Component({
  selector: 'app-logs',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/admin"></ion-back-button>
        </ion-buttons>
        <ion-title>Logs de l'Application</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="refreshLogs()">
            <ion-icon name="refresh"></ion-icon>
          </ion-button>
          <ion-button (click)="exportLogs()">
            <ion-icon name="download"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <!-- Filtres et contrôles -->
      <ion-card>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="12" size-md="4">
                <ion-item>
                  <ion-label>Niveau de Log</ion-label>
                  <ion-select [(ngModel)]="selectedLevel" (ionChange)="applyFilters()">
                    <ion-select-option value="">Tous</ion-select-option>
                    <ion-select-option value="DEBUG">DEBUG</ion-select-option>
                    <ion-select-option value="INFO">INFO</ion-select-option>
                    <ion-select-option value="WARN">WARN</ion-select-option>
                    <ion-select-option value="ERROR">ERROR</ion-select-option>
                    <ion-select-option value="CRITICAL">CRITICAL</ion-select-option>
                  </ion-select>
                </ion-item>
              </ion-col>
              <ion-col size="12" size-md="4">
                <ion-item>
                  <ion-label>Catégorie</ion-label>
                  <ion-select [(ngModel)]="selectedCategory" (ionChange)="applyFilters()">
                    <ion-select-option value="">Toutes</ion-select-option>
                    <ion-select-option *ngFor="let category of availableCategories" [value]="category">
                      {{ category }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
              </ion-col>
              <ion-col size="12" size-md="4">
                <ion-item>
                  <ion-label>Utilisateur</ion-label>
                  <ion-select [(ngModel)]="selectedUser" (ionChange)="applyFilters()">
                    <ion-select-option value="">Tous</ion-select-option>
                    <ion-select-option *ngFor="let user of availableUsers" [value]="user">
                      {{ user }}
                    </ion-select-option>
                  </ion-select>
                </ion-item>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col size="12">
                <ion-item>
                  <ion-label position="stacked">Recherche</ion-label>
                  <ion-input 
                    [(ngModel)]="searchTerm" 
                    placeholder="Rechercher dans les messages..."
                    (ionInput)="applyFilters()"
                    clearInput="true">
                  </ion-input>
                </ion-item>
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col size="12">
                <ion-button expand="block" fill="outline" (click)="clearFilters()">
                  <ion-icon name="close-circle" slot="start"></ion-icon>
                  Effacer les filtres
                </ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

      <!-- Statistiques -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>📊 Statistiques</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="6" size-md="3">
                <div class="stat-item">
                  <div class="stat-number">{{ filteredLogs.length }}</div>
                  <div class="stat-label">Logs filtrés</div>
                </div>
              </ion-col>
              <ion-col size="6" size-md="3">
                <div class="stat-item">
                  <div class="stat-number">{{ totalLogs }}</div>
                  <div class="stat-label">Total logs</div>
                </div>
              </ion-col>
              <ion-col size="6" size-md="3">
                <div class="stat-item">
                  <div class="stat-number">{{ errorCount }}</div>
                  <div class="stat-label">Erreurs</div>
                </div>
              </ion-col>
              <ion-col size="6" size-md="3">
                <div class="stat-item">
                  <div class="stat-number">{{ getMemoryUsage() }}MB</div>
                  <div class="stat-label">Mémoire</div>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-card-content>
      </ion-card>

      <!-- Liste des logs -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>📋 Logs</ion-card-title>
          <ion-card-subtitle>{{ filteredLogs.length }} entrées affichées</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <div class="logs-container">
            <div *ngFor="let log of paginatedLogs" class="log-entry" [ngClass]="getLogClass(log.level)">
              <div class="log-header">
                <div class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</div>
                <div class="log-level" [ngClass]="'level-' + log.level">
                  {{ LogLevel[log.level] }}
                </div>
                <div class="log-category">{{ log.category }}</div>
                <div class="log-user" *ngIf="log.userId">{{ log.userId }}</div>
              </div>
              <div class="log-message">{{ log.message }}</div>
              <div class="log-context" *ngIf="log.context && Object.keys(log.context).length > 0">
                <details>
                  <summary>Contexte ({{ Object.keys(log.context).length }} propriétés)</summary>
                  <pre>{{ formatContext(log.context) }}</pre>
                </details>
              </div>
              <div class="log-meta">
                <span *ngIf="log.memoryUsage" class="meta-item">
                  <ion-icon name="hardware-chip"></ion-icon>
                  {{ log.memoryUsage }}MB
                </span>
                <span *ngIf="log.requestId" class="meta-item">
                  <ion-icon name="link"></ion-icon>
                  {{ log.requestId }}
                </span>
                <span *ngIf="log.duration" class="meta-item">
                  <ion-icon name="time"></ion-icon>
                  {{ log.duration }}ms
                </span>
              </div>
              <div class="log-stack" *ngIf="log.errorStack">
                <details>
                  <summary>Stack Trace</summary>
                  <pre>{{ log.errorStack }}</pre>
                </details>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="pagination" *ngIf="totalPages > 1">
            <ion-button 
              fill="clear" 
              [disabled]="currentPage === 1"
              (click)="previousPage()">
              <ion-icon name="chevron-back"></ion-icon>
              Précédent
            </ion-button>
            <span class="page-info">
              Page {{ currentPage }} sur {{ totalPages }}
            </span>
            <ion-button 
              fill="clear" 
              [disabled]="currentPage === totalPages"
              (click)="nextPage()">
              Suivant
              <ion-icon name="chevron-forward"></ion-icon>
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .logs-container {
      max-height: 600px;
      overflow-y: auto;
    }

    .log-entry {
      border-left: 4px solid #ccc;
      margin-bottom: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .log-entry.level-0 { border-left-color: #6c757d; } /* DEBUG */
    .log-entry.level-1 { border-left-color: #007bff; } /* INFO */
    .log-entry.level-2 { border-left-color: #ffc107; } /* WARN */
    .log-entry.level-3 { border-left-color: #dc3545; } /* ERROR */
    .log-entry.level-4 { border-left-color: #721c24; } /* CRITICAL */

    .log-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .log-timestamp {
      font-family: monospace;
      font-size: 0.9em;
      color: #666;
    }

    .log-level {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: bold;
      text-transform: uppercase;
    }

    .level-0 { background: #6c757d; color: white; }
    .level-1 { background: #007bff; color: white; }
    .level-2 { background: #ffc107; color: black; }
    .level-3 { background: #dc3545; color: white; }
    .level-4 { background: #721c24; color: white; }

    .log-category {
      font-weight: bold;
      color: #495057;
    }

    .log-user {
      font-size: 0.9em;
      color: #6c757d;
      font-family: monospace;
    }

    .log-message {
      font-weight: 500;
      margin-bottom: 8px;
      color: #212529;
    }

    .log-context {
      margin-bottom: 8px;
    }

    .log-context summary {
      cursor: pointer;
      color: #007bff;
      font-size: 0.9em;
    }

    .log-context pre {
      background: #e9ecef;
      padding: 8px;
      border-radius: 4px;
      font-size: 0.8em;
      margin-top: 4px;
      overflow-x: auto;
    }

    .log-meta {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8em;
      color: #6c757d;
    }

    .log-stack {
      margin-top: 8px;
    }

    .log-stack summary {
      cursor: pointer;
      color: #dc3545;
      font-size: 0.9em;
    }

    .log-stack pre {
      background: #f8d7da;
      color: #721c24;
      padding: 8px;
      border-radius: 4px;
      font-size: 0.8em;
      margin-top: 4px;
      overflow-x: auto;
    }

    .stat-item {
      text-align: center;
      padding: 16px;
    }

    .stat-number {
      font-size: 2em;
      font-weight: bold;
      color: #007bff;
    }

    .stat-label {
      font-size: 0.9em;
      color: #6c757d;
      margin-top: 4px;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #dee2e6;
    }

    .page-info {
      font-size: 0.9em;
      color: #6c757d;
    }

    ion-card {
      margin: 16px;
    }

    ion-item {
      --padding-start: 0;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LogsPage implements OnInit, OnDestroy {
  LogLevel = LogLevel; // Pour l'utilisation dans le template
  Object = Object; // Pour l'utilisation de Object.keys dans le template
  
  logs: LogEntry[] = [];
  filteredLogs: LogEntry[] = [];
  paginatedLogs: LogEntry[] = [];
  
  // Filtres
  selectedLevel: string = '';
  selectedCategory: string = '';
  selectedUser: string = '';
  searchTerm: string = '';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 50;
  totalPages: number = 1;
  
  // Statistiques
  totalLogs: number = 0;
  errorCount: number = 0;
  
  // Données disponibles pour les filtres
  availableCategories: string[] = [];
  availableUsers: string[] = [];
  
  private logsSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.logger.info('Logs', 'Page des logs chargée');
    this.loadLogs();
    this.setupLogsSubscription();
  }

  ngOnDestroy() {
    if (this.logsSubscription) {
      this.logsSubscription.unsubscribe();
    }
  }

  private setupLogsSubscription() {
    this.logsSubscription = this.logger.logs$.subscribe(logs => {
      this.logs = logs;
      this.updateAvailableFilters();
      this.applyFilters();
    });
  }

  private loadLogs() {
    this.logs = this.logger.getLogs();
    this.updateAvailableFilters();
    this.applyFilters();
  }

  private updateAvailableFilters() {
    // Extraire les catégories uniques
    const categories = new Set<string>();
    const users = new Set<string>();
    
    this.logs.forEach(log => {
      if (log.category) categories.add(log.category);
      if (log.userId) users.add(log.userId);
    });
    
    this.availableCategories = Array.from(categories).sort();
    this.availableUsers = Array.from(users).sort();
  }

  applyFilters() {
    this.filteredLogs = this.logs.filter(log => {
      // Filtre par niveau
      if (this.selectedLevel && LogLevel[log.level] !== this.selectedLevel) {
        return false;
      }
      
      // Filtre par catégorie
      if (this.selectedCategory && log.category !== this.selectedCategory) {
        return false;
      }
      
      // Filtre par utilisateur
      if (this.selectedUser && log.userId !== this.selectedUser) {
        return false;
      }
      
      // Filtre par recherche
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const messageMatch = log.message.toLowerCase().includes(searchLower);
        const contextMatch = log.context && JSON.stringify(log.context).toLowerCase().includes(searchLower);
        if (!messageMatch && !contextMatch) {
          return false;
        }
      }
      
      return true;
    });
    
    this.updateStatistics();
    this.updatePagination();
  }

  clearFilters() {
    this.selectedLevel = '';
    this.selectedCategory = '';
    this.selectedUser = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  private updateStatistics() {
    this.totalLogs = this.logs.length;
    this.errorCount = this.logs.filter(log => log.level >= LogLevel.ERROR).length;
  }

  private updatePagination() {
    this.totalPages = Math.ceil(this.filteredLogs.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    this.updatePaginatedLogs();
  }

  private updatePaginatedLogs() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedLogs = this.filteredLogs.slice(startIndex, endIndex);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedLogs();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedLogs();
    }
  }

  refreshLogs() {
    this.logger.info('Logs', 'Actualisation des logs demandée');
    this.loadLogs();
  }

  exportLogs() {
    this.logger.info('Logs', 'Export des logs filtrés demandé');
    const jsonData = JSON.stringify(this.filteredLogs, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bob-logs-filtered-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  getLogClass(level: LogLevel): string {
    return `level-${level}`;
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  formatContext(context: any): string {
    return JSON.stringify(context, null, 2);
  }

  getMemoryUsage(): number {
    if ('memory' in performance) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }
} 