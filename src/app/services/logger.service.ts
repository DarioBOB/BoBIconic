/**
 * LoggerService - Service de logging centralisé pour BOB
 * ---------------------------------------------------------------------
 * Tous les logs sont persistés dans logs/app.log (racine du projet)
 * Accessible à l'IA et à l'utilisateur pour analyse/export
 * ---------------------------------------------------------------------
 * Rôle :
 *   - Centralise tous les logs de l'application avec différents niveaux
 *   - Gère la rotation des fichiers de logs
 *   - Formate les logs de manière structurée et lisible
 *   - Permet l'export et la consultation des logs
 *   - Gère les logs en mode développement et production
 *   - Intégration avec les services existants (Window, Auth, etc.)
 *
 * Niveaux de log :
 *   - DEBUG : Informations détaillées pour le développement
 *   - INFO : Informations générales sur le fonctionnement
 *   - WARN : Avertissements non critiques
 *   - ERROR : Erreurs qui n'empêchent pas le fonctionnement
 *   - CRITICAL : Erreurs critiques qui peuvent impacter l'application
 *
 * Bonnes pratiques :
 *   - Utiliser le bon niveau de log selon le contexte
 *   - Inclure le contexte (service, action, utilisateur) dans les logs
 *   - Éviter les logs sensibles (mots de passe, tokens)
 *   - Documenter les nouveaux types de logs
 */

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Auth, user } from '@angular/fire/auth';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  context?: any;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  duration?: number; // Durée d'exécution en ms
  memoryUsage?: number; // Utilisation mémoire en MB
  errorStack?: string; // Stack trace pour les erreurs
  requestId?: string; // ID unique pour tracer les requêtes
  correlationId?: string; // ID pour corréler les logs liés
}

export interface LogConfig {
  maxFileSize: number; // en bytes
  maxFiles: number;
  logLevel: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  enableMetrics: boolean;
  autoCleanup: boolean;
  cleanupInterval: number; // en heures
  enableRequestTracing: boolean; // Traçage des requêtes
  enablePerformanceMonitoring: boolean; // Monitoring des performances
}

export interface LogMetrics {
  total: number;
  byLevel: { [key: string]: number };
  byCategory: { [key: string]: number };
  byUser: { [key: string]: number };
  byHour: { [key: string]: number };
  byDay: { [key: string]: number };
  performance: {
    avgResponseTime: number;
    maxResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    requestCount: number;
    successRate: number;
  };
  timeRange: {
    first: string;
    last: string;
    duration: number; // en heures
  };
  alerts: {
    errorSpike: boolean;
    performanceDegradation: boolean;
    memoryLeak: boolean;
  };
}

const LOG_PROXY_URL = 'http://localhost:3040';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logs: LogEntry[] = [];
  private sessionId: string;
  private config: LogConfig;
  private maxLogsInMemory = 5000; // Augmenté pour plus de capacité
  private performanceMetrics = new Map<string, number>();
  private requestMetrics = new Map<string, { count: number, errors: number, avgTime: number }>();
  private cleanupTimer: any;
  private metricsTimer: any;
  private alertTimer: any;

  // Observables pour la réactivité
  private logsSubject = new BehaviorSubject<LogEntry[]>([]);
  private metricsSubject = new BehaviorSubject<LogMetrics | null>(null);
  private configSubject = new BehaviorSubject<LogConfig | null>(null);
  private alertsSubject = new BehaviorSubject<any[]>([]);

  logs$ = this.logsSubject.asObservable();
  metrics$ = this.metricsSubject.asObservable();
  config$ = this.configSubject.asObservable();
  alerts$ = this.alertsSubject.asObservable();

  constructor(private auth: Auth) {
    this.sessionId = this.generateSessionId();
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      logLevel: LogLevel.INFO, // Réduit à INFO
      enableConsole: true,
      enableFile: true,
      enableRemote: true, // Proxy activé
      enableMetrics: true,
      autoCleanup: true,
      cleanupInterval: 24, // 24 heures
      enableRequestTracing: true,
      enablePerformanceMonitoring: true
    };

    this.initializeService();
  }

  /**
   * Initialise le service de logging
   */
  private initializeService(): void {
    // Log de démarrage du service
    this.info('LoggerService', 'Service de logging initialisé', {
      sessionId: this.sessionId,
      environment: environment.production ? 'production' : 'development',
      logLevel: LogLevel[this.config.logLevel],
      config: this.config,
      version: '2.0.0'
    });

    // Écouter les changements d'authentification
    if (this.auth) {
      user(this.auth).subscribe((user) => {
        if (user) {
          this.info('Auth', 'Utilisateur connecté', {
            userId: user.uid,
            email: user.email,
            provider: user.providerData[0]?.providerId,
            emailVerified: user.emailVerified
          });
        } else {
          this.info('Auth', 'Utilisateur déconnecté');
        }
      });
    }

    // Démarrer le nettoyage automatique
    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }

    // Démarrer la collecte de métriques
    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }

    // Démarrer le monitoring des alertes
    if (this.config.enablePerformanceMonitoring) {
      this.startAlertMonitoring();
    }

    // Publier la configuration
    this.configSubject.next(this.config);
  }

  /**
   * Génère un ID de session unique
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Génère un ID de requête unique
   */
  generateRequestId(): string {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  /**
   * Log de niveau DEBUG
   */
  debug(category: string, message: string, context?: any): void {
    this.log(LogLevel.DEBUG, category, message, context);
  }

  /**
   * Log de niveau INFO
   */
  info(category: string, message: string, context?: any): void {
    this.log(LogLevel.INFO, category, message, context);
  }

  /**
   * Log de niveau WARN
   */
  warn(category: string, message: string, context?: any): void {
    this.log(LogLevel.WARN, category, message, context);
  }

  /**
   * Log de niveau ERROR
   */
  error(category: string, message: string, context?: any, error?: Error): void {
    this.log(LogLevel.ERROR, category, message, context, error);
  }

  /**
   * Log de niveau CRITICAL
   */
  critical(category: string, message: string, context?: any, error?: Error): void {
    this.log(LogLevel.CRITICAL, category, message, context, error);
  }

  /**
   * Log de performance avec mesure de durée
   */
  performance(category: string, operation: string, startTime: number, context?: any): void {
    const duration = Date.now() - startTime;
    this.info(category, `Performance: ${operation}`, {
      ...context,
      duration,
      operation
    });
    
    // Stocker pour les métriques
    this.performanceMetrics.set(`${category}_${operation}`, duration);
  }

  /**
   * Log de requête avec traçage
   */
  request(category: string, method: string, url: string, startTime: number, context?: any): string {
    const requestId = this.generateRequestId();
    const duration = Date.now() - startTime;
    
    this.info(category, `Request: ${method} ${url}`, {
      ...context,
      requestId,
      method,
      url,
      duration,
      status: 'success'
    });

    // Mettre à jour les métriques de requête
    const key = `${category}_${method}`;
    const current = this.requestMetrics.get(key) || { count: 0, errors: 0, avgTime: 0 };
    current.count++;
    current.avgTime = (current.avgTime * (current.count - 1) + duration) / current.count;
    this.requestMetrics.set(key, current);

    return requestId;
  }

  /**
   * Log d'erreur de requête
   */
  requestError(category: string, method: string, url: string, error: any, requestId?: string, context?: any): void {
    const duration = Date.now() - (context?.startTime || Date.now());
    
    this.error(category, `Request Error: ${method} ${url}`, {
      ...context,
      requestId,
      method,
      url,
      duration,
      error: error?.message || error,
      status: 'error'
    }, error instanceof Error ? error : new Error(String(error)));

    // Mettre à jour les métriques d'erreur
    const key = `${category}_${method}`;
    const current = this.requestMetrics.get(key) || { count: 0, errors: 0, avgTime: 0 };
    current.errors++;
    this.requestMetrics.set(key, current);
  }

  /**
   * Méthode principale de logging
   */
  private log(level: LogLevel, category: string, message: string, context?: any, error?: Error): void {
    // Vérifier le niveau de log configuré
    if (level < this.config.logLevel) {
      return;
    }

    const startTime = Date.now();
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context: this.sanitizeContext(context),
      userId: (this.auth && typeof this.auth.currentUser !== 'undefined' && this.auth.currentUser) ? this.auth.currentUser.uid : undefined,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      memoryUsage: this.getMemoryUsage(),
      errorStack: error?.stack,
      requestId: context?.requestId,
      correlationId: context?.correlationId
    };

    // Ajouter au tableau en mémoire
    this.logs.push(logEntry);

    // Limiter le nombre de logs en mémoire
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }

    // Publier les logs mis à jour
    this.logsSubject.next([...this.logs]);

    // Affichage console
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Sauvegarde fichier
    if (this.config.enableFile) {
      this.logToFile(logEntry);
    }

    // Envoi remote (optionnel)
    if (this.config.enableRemote) {
      this.logToRemote(logEntry);
    }

    // Mettre à jour les métriques
    if (this.config.enableMetrics) {
      this.updateMetrics();
    }
  }

  /**
   * Récupère l'utilisation mémoire
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  /**
   * Nettoie le contexte des données sensibles
   */
  private sanitizeContext(context: any): any {
    if (!context) return context;
    
    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Affichage dans la console avec couleurs
   */
  private logToConsole(entry: LogEntry): void {
    // Filtrer les logs Firebase trop verbeux
    if (typeof entry.message === 'string' && entry.message.includes('Firebase API called outside injection context')) {
      return; // Ignore ce log
    }
    // Log normal sinon
    const logLine = this.formatLogLine(entry);
    switch (entry.level) {
      case LogLevel.DEBUG:
        if (this.config.logLevel <= LogLevel.DEBUG) console.debug(logLine);
        break;
      case LogLevel.INFO:
        if (this.config.logLevel <= LogLevel.INFO) console.info(logLine);
        break;
      case LogLevel.WARN:
        if (this.config.logLevel <= LogLevel.WARN) console.warn(logLine);
        break;
      case LogLevel.ERROR:
        if (this.config.logLevel <= LogLevel.ERROR) console.error(logLine);
        break;
      case LogLevel.CRITICAL:
        if (this.config.logLevel <= LogLevel.CRITICAL) console.error(logLine);
        break;
    }
  }

  /**
   * Sauvegarde dans un fichier
   */
  private logToFile(entry: LogEntry): void {
    try {
      const logLine = this.formatLogLine(entry);
      
      // Envoyer au proxy seulement si enableRemote est activé
      if (this.config.enableRemote) {
        fetch(LOG_PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: logLine
        }).catch((err) => {
          console.error('[LoggerService] Echec d\'envoi au proxy:', err);
        });
      }
      
      console.log('[LOG]', logLine);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du log:', error);
    }
  }

  /**
   * Envoi remote (optionnel)
   */
  private logToRemote(entry: LogEntry): void {
    // DÉSACTIVÉ : proxy local qui cause des erreurs
    // if (!this.config.enableRemote) return;
    // try {
    //   const response = await fetch('http://localhost:3040/logs', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(entry)
    //   });
    //   if (!response.ok) {
    //     console.warn('[LoggerService] Echec d\'envoi au proxy:', response.statusText);
    //   }
    // } catch (error) {
    //   console.warn('[LoggerService] Echec d\'envoi au proxy:', error);
    // }
  }

  /**
   * Formate une ligne de log
   */
  private formatLogLine(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = LogLevel[entry.level];
    const category = entry.category;
    const message = entry.message;
    const context = entry.context ? JSON.stringify(entry.context) : '';
    const userId = entry.userId || 'anonymous';
    const sessionId = entry.sessionId;
    const memory = entry.memoryUsage || 0;
    const requestId = entry.requestId || '';

    return `${timestamp} | ${level} | ${category} | ${userId} | ${sessionId} | ${memory}MB | ${requestId} | ${message} | ${context}`;
  }

  /**
   * Démarre le nettoyage automatique
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = interval(this.config.cleanupInterval * 60 * 60 * 1000)
      .pipe(takeWhile(() => this.config.autoCleanup))
      .subscribe(() => {
        this.cleanupOldLogs();
      });
  }

  /**
   * Nettoie les anciens logs
   */
  private cleanupOldLogs(): void {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - this.config.cleanupInterval);

    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoffTime);
    
    if (this.logs.length < initialCount) {
      this.info('LoggerService', `Nettoyage automatique: ${initialCount - this.logs.length} logs supprimés`);
      this.logsSubject.next([...this.logs]);
    }
  }

  /**
   * Démarre la collecte de métriques
   */
  private startMetricsCollection(): void {
    this.metricsTimer = interval(5 * 60 * 1000) // Toutes les 5 minutes
      .pipe(takeWhile(() => this.config.enableMetrics))
      .subscribe(() => {
        this.updateMetrics();
      });
  }

  /**
   * Démarre le monitoring des alertes
   */
  private startAlertMonitoring(): void {
    this.alertTimer = interval(10 * 60 * 1000) // Toutes les 10 minutes
      .pipe(takeWhile(() => this.config.enablePerformanceMonitoring))
      .subscribe(() => {
        this.checkAlerts();
      });
  }

  /**
   * Vérifie les alertes de performance
   */
  private checkAlerts(): void {
    const alerts: any[] = [];
    const metrics = this.calculateMetrics();

    // Vérifier le taux d'erreur
    if (metrics.performance.errorRate > 10) {
      alerts.push({
        type: 'error_spike',
        message: `Taux d'erreur élevé: ${metrics.performance.errorRate.toFixed(2)}%`,
        severity: 'high'
      });
    }

    // Vérifier la performance
    if (metrics.performance.avgResponseTime > 5000) {
      alerts.push({
        type: 'performance_degradation',
        message: `Temps de réponse moyen élevé: ${metrics.performance.avgResponseTime.toFixed(0)}ms`,
        severity: 'medium'
      });
    }

    // Vérifier l'utilisation mémoire
    if (metrics.performance.memoryUsage > 100) {
      alerts.push({
        type: 'memory_leak',
        message: `Utilisation mémoire élevée: ${metrics.performance.memoryUsage.toFixed(0)}MB`,
        severity: 'medium'
      });
    }

    if (alerts.length > 0) {
      this.alertsSubject.next(alerts);
      this.warn('LoggerService', 'Alertes de performance détectées', { alerts });
    }
  }

  /**
   * Met à jour les métriques
   */
  private updateMetrics(): void {
    const metrics = this.calculateMetrics();
    this.metricsSubject.next(metrics);
  }

  /**
   * Calcule les métriques détaillées
   */
  private calculateMetrics(): LogMetrics {
    const now = new Date();
    const metrics: LogMetrics = {
      total: this.logs.length,
      byLevel: {},
      byCategory: {},
      byUser: {},
      byHour: {},
      byDay: {},
      performance: {
        avgResponseTime: 0,
        maxResponseTime: 0,
        errorRate: 0,
        memoryUsage: 0,
        requestCount: 0,
        successRate: 0
      },
      timeRange: {
        first: this.logs[0]?.timestamp || '',
        last: this.logs[this.logs.length - 1]?.timestamp || '',
        duration: 0
      },
      alerts: {
        errorSpike: false,
        performanceDegradation: false,
        memoryLeak: false
      }
    };

    // Statistiques par niveau
    Object.values(LogLevel).forEach(level => {
      if (typeof level === 'string') {
        metrics.byLevel[level] = this.logs.filter(log => LogLevel[log.level] === level).length;
      }
    });

    // Statistiques par catégorie
    this.logs.forEach(log => {
      metrics.byCategory[log.category] = (metrics.byCategory[log.category] || 0) + 1;
    });

    // Statistiques par utilisateur
    this.logs.forEach(log => {
      const userId = log.userId || 'anonymous';
      metrics.byUser[userId] = (metrics.byUser[userId] || 0) + 1;
    });

    // Statistiques par heure et jour
    this.logs.forEach(log => {
      const date = new Date(log.timestamp);
      const hour = date.getHours().toString().padStart(2, '0');
      const day = date.toDateString();
      
      metrics.byHour[hour] = (metrics.byHour[hour] || 0) + 1;
      metrics.byDay[day] = (metrics.byDay[day] || 0) + 1;
    });

    // Métriques de performance
    const responseTimes = Array.from(this.performanceMetrics.values());
    if (responseTimes.length > 0) {
      metrics.performance.avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      metrics.performance.maxResponseTime = Math.max(...responseTimes);
    }

    // Métriques de requêtes
    let totalRequests = 0;
    let totalErrors = 0;
    this.requestMetrics.forEach(metric => {
      totalRequests += metric.count;
      totalErrors += metric.errors;
    });
    metrics.performance.requestCount = totalRequests;
    metrics.performance.successRate = totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests) * 100 : 100;

    // Taux d'erreur
    const errorCount = this.logs.filter(log => log.level >= LogLevel.ERROR).length;
    metrics.performance.errorRate = this.logs.length > 0 ? (errorCount / this.logs.length) * 100 : 0;

    // Utilisation mémoire moyenne
    const memoryUsage = this.logs.map(log => log.memoryUsage || 0);
    metrics.performance.memoryUsage = memoryUsage.length > 0 ? 
      memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length : 0;

    // Durée de la session
    if (metrics.timeRange.first && metrics.timeRange.last) {
      const first = new Date(metrics.timeRange.first);
      const last = new Date(metrics.timeRange.last);
      metrics.timeRange.duration = (last.getTime() - first.getTime()) / (1000 * 60 * 60); // en heures
    }

    // Alertes
    metrics.alerts.errorSpike = metrics.performance.errorRate > 10;
    metrics.alerts.performanceDegradation = metrics.performance.avgResponseTime > 5000;
    metrics.alerts.memoryLeak = metrics.performance.memoryUsage > 100;

    return metrics;
  }

  // Méthodes publiques pour la récupération des données

  /**
   * Récupère tous les logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Récupère les logs par niveau
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level >= level);
  }

  /**
   * Récupère les logs par catégorie
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Récupère les logs par utilisateur
   */
  getLogsByUser(userId: string): LogEntry[] {
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Récupère les logs d'une session
   */
  getLogsBySession(sessionId: string): LogEntry[] {
    return this.logs.filter(log => log.sessionId === sessionId);
  }

  /**
   * Récupère les logs d'une période
   */
  getLogsByDateRange(startDate: Date, endDate: Date): LogEntry[] {
    return this.logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  /**
   * Récupère les erreurs récentes
   */
  getRecentErrors(hours: number = 24): LogEntry[] {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    return this.logs.filter(log => 
      log.level >= LogLevel.ERROR && 
      new Date(log.timestamp) > cutoffTime
    );
  }

  /**
   * Récupère les logs par ID de requête
   */
  getLogsByRequestId(requestId: string): LogEntry[] {
    return this.logs.filter(log => log.requestId === requestId);
  }

  /**
   * Exporte les logs en JSON
   */
  exportLogsAsJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Exporte les logs en CSV
   */
  exportLogsAsCSV(): string {
    const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Context', 'UserId', 'SessionId', 'MemoryUsage', 'URL', 'RequestId'];
    const csvContent = [
      headers.join(','),
      ...this.logs.map(log => [
        log.timestamp,
        LogLevel[log.level],
        log.category,
        `"${log.message.replace(/"/g, '""')}"`,
        `"${JSON.stringify(log.context || {}).replace(/"/g, '""')}"`,
        log.userId || '',
        log.sessionId,
        log.memoryUsage || 0,
        log.url || '',
        log.requestId || ''
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Vide tous les logs
   */
  clearLogs(): void {
    this.logs = [];
    this.logsSubject.next([]);
    this.performanceMetrics.clear();
    this.requestMetrics.clear();
    localStorage.removeItem('bob_logs');
    this.info('LoggerService', 'Logs vidés');
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
    this.configSubject.next(this.config);
    this.info('LoggerService', 'Configuration mise à jour', { config: this.config });
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): LogConfig {
    return { ...this.config };
  }

  /**
   * Récupère les statistiques des logs
   */
  getLogStats(): LogMetrics {
    return this.calculateMetrics();
  }

  /**
   * Récupère les métriques de requêtes
   */
  getRequestMetrics(): Map<string, { count: number, errors: number, avgTime: number }> {
    return new Map(this.requestMetrics);
  }

  /**
   * Nettoyage lors de la destruction du service
   */
  ngOnDestroy(): void {
    if (this.cleanupTimer) {
      this.cleanupTimer.unsubscribe();
    }
    if (this.metricsTimer) {
      this.metricsTimer.unsubscribe();
    }
    if (this.alertTimer) {
      this.alertTimer.unsubscribe();
    }
  }
} 