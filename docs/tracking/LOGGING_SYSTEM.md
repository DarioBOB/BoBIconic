# 📋 Système de Logging BOB - Documentation Complète

## 🎯 Vue d'ensemble

Le système de logging de BOB est un service centralisé qui capture, stocke et analyse tous les événements de l'application. Il fournit une visibilité complète sur le fonctionnement de l'application et facilite le débogage et le monitoring.

## 🏗️ Architecture

### Composants principaux

1. **LoggerService** (`src/app/services/logger.service.ts`)
   - Service central de logging
   - Gestion des niveaux et catégories
   - Métriques et statistiques
   - Rotation et nettoyage automatique

2. **LogsPage** (`src/app/pages/admin/logs.page.ts`)
   - Interface d'administration des logs
   - Filtres et recherche avancés
   - Export des données
   - Visualisation des métriques

3. **Configuration**
   - Niveaux de log configurables
   - Rotation automatique des fichiers
   - Métriques de performance
   - Nettoyage automatique

## 📊 Niveaux de Log

| Niveau | Description | Usage |
|--------|-------------|-------|
| **DEBUG** | Informations détaillées pour le développement | Variables, états intermédiaires, traces d'exécution |
| **INFO** | Informations générales sur le fonctionnement | Actions utilisateur, connexions, opérations réussies |
| **WARN** | Avertissements non critiques | Données manquantes, timeouts, retry |
| **ERROR** | Erreurs qui n'empêchent pas le fonctionnement | Échecs API, validations, erreurs réseau |
| **CRITICAL** | Erreurs critiques impactant l'application | Crashes, erreurs d'authentification, panne système |

## 🏷️ Catégories de Log

### Catégories principales

- **Auth** : Authentification et autorisation
- **Window** : Fonctionnalités de la page Window
- **Flight** : Recherche et suivi de vols
- **API** : Appels aux services externes
- **Database** : Opérations Firestore
- **UI** : Interactions utilisateur
- **Performance** : Métriques de performance
- **System** : Événements système

### Catégories spécialisées

- **LoggerService** : Logs du service de logging lui-même
- **Admin** : Actions d'administration
- **Demo** : Données de démonstration
- **Error** : Gestion d'erreurs
- **Security** : Événements de sécurité

## 🔧 Utilisation du LoggerService

### Injection et initialisation

```typescript
import { LoggerService } from '../services/logger.service';

constructor(private logger: LoggerService) {
  // Le service s'initialise automatiquement
}
```

### Méthodes de logging

```typescript
// Logs standards
this.logger.debug('Category', 'Message détaillé', { context: 'data' });
this.logger.info('Category', 'Information générale', { userId: '123' });
this.logger.warn('Category', 'Avertissement', { retryCount: 3 });
this.logger.error('Category', 'Erreur survenue', { error: 'details' }, errorObject);
this.logger.critical('Category', 'Erreur critique', { impact: 'high' }, errorObject);

// Log de performance
const startTime = Date.now();
// ... opération ...
this.logger.performance('Category', 'OperationName', startTime, { params: 'data' });
```

### Récupération des logs

```typescript
// Récupération par critères
const errors = this.logger.getRecentErrors(24); // 24 dernières heures
const userLogs = this.logger.getLogsByUser('userId');
const categoryLogs = this.logger.getLogsByCategory('Flight');

// Export
const jsonLogs = this.logger.exportLogsAsJSON();
const csvLogs = this.logger.exportLogsAsCSV();

// Statistiques
const stats = this.logger.getLogStats();
```

## 📈 Métriques et Statistiques

### Métriques collectées

- **Volume** : Nombre total de logs par période
- **Répartition** : Logs par niveau, catégorie, utilisateur
- **Performance** : Temps de réponse moyen, taux d'erreur
- **Ressources** : Utilisation mémoire, durée de session
- **Temporalité** : Distribution par heure et jour

### Accès aux métriques

```typescript
// Observable des métriques
this.logger.metrics$.subscribe(metrics => {
  console.log('Métriques mises à jour:', metrics);
});

// Métriques statiques
const currentMetrics = this.logger.getLogStats();
```

## 🛠️ Configuration

### Configuration par défaut

```typescript
const defaultConfig: LogConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  logLevel: environment.production ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableRemote: false,
  enableMetrics: true,
  autoCleanup: true,
  cleanupInterval: 24 // 24 heures
};
```

### Modification de la configuration

```typescript
// Mise à jour partielle
this.logger.updateConfig({
  logLevel: LogLevel.DEBUG,
  enableMetrics: false
});

// Récupération de la config actuelle
const config = this.logger.getConfig();
```

## 🔍 Interface d'Administration

### Accès

- URL : `http://localhost:8100/admin/logs`
- Accès : Administrateurs uniquement
- Route : `/admin/logs` (protégée par `adminOnlyGuard`)

### Fonctionnalités

1. **Visualisation en temps réel**
   - Liste paginée des logs
   - Actualisation automatique
   - Tri par colonnes

2. **Filtres avancés**
   - Par niveau de log
   - Par catégorie
   - Par utilisateur
   - Par période
   - Recherche textuelle

3. **Export et gestion**
   - Export JSON/CSV
   - Nettoyage des logs
   - Statistiques détaillées

4. **Métriques visuelles**
   - Graphiques de répartition
   - Évolution temporelle
   - Indicateurs de performance

## 🚀 Intégration avec les Services Existants

### WindowService

```typescript
// Dans window.service.ts
constructor(private logger: LoggerService) {}

searchFlight(callsign: string): Observable<FlightData> {
  const startTime = Date.now();
  this.logger.info('Window', `Recherche de vol: ${callsign}`);
  
  return this.flightService.getFlightData(callsign).pipe(
    tap(data => {
      this.logger.performance('Window', 'searchFlight', startTime, { 
        callsign, 
        resultCount: data?.length || 0 
      });
    }),
    catchError(error => {
      this.logger.error('Window', `Erreur recherche vol: ${callsign}`, { error: error.message }, error);
      throw error;
    })
  );
}
```

### AuthService

```typescript
// Dans auth.service.ts
async signIn(email: string, password: string): Promise<UserCredential> {
  this.logger.info('Auth', 'Tentative de connexion', { email });
  
  try {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    this.logger.info('Auth', 'Connexion réussie', { 
      userId: result.user.uid, 
      email: result.user.email 
    });
    return result;
  } catch (error) {
    this.logger.error('Auth', 'Échec de connexion', { email, error: error.code }, error);
    throw error;
  }
}
```

### FlightService

```typescript
// Dans flight.service.ts
getFlightData(callsign: string): Observable<FlightData> {
  const startTime = Date.now();
  this.logger.debug('Flight', `Récupération données vol: ${callsign}`);
  
  return this.http.get<FlightData>(`${this.apiUrl}/flight/${callsign}`).pipe(
    tap(data => {
      this.logger.performance('Flight', 'getFlightData', startTime, { 
        callsign, 
        dataReceived: !!data 
      });
    }),
    catchError(error => {
      this.logger.error('Flight', `Erreur API vol: ${callsign}`, { 
        status: error.status, 
        url: error.url 
      }, error);
      throw error;
    })
  );
}
```

## 📋 Bonnes Pratiques

### 1. Choix du niveau de log

- **DEBUG** : Pour le développement uniquement
- **INFO** : Actions utilisateur, opérations réussies
- **WARN** : Situations anormales mais non critiques
- **ERROR** : Échecs d'opérations, erreurs réseau
- **CRITICAL** : Erreurs système, problèmes de sécurité

### 2. Contexte et données

```typescript
// ✅ Bon - Contexte utile
this.logger.info('Flight', 'Vol trouvé', { 
  callsign: 'AF123', 
  airline: 'Air France',
  resultCount: 1 
});

// ❌ Mauvais - Données sensibles
this.logger.info('Auth', 'Connexion', { 
  password: 'secret123', // Ne jamais logger
  token: 'jwt_token'     // Ne jamais logger
});
```

### 3. Messages descriptifs

```typescript
// ✅ Bon - Message clair
this.logger.error('API', 'Échec appel AviationStack API', { 
  endpoint: '/flight', 
  status: 429,
  retryCount: 3 
});

// ❌ Mauvais - Message vague
this.logger.error('API', 'Erreur', { error: 'failed' });
```

### 4. Gestion des erreurs

```typescript
try {
  // Opération risquée
} catch (error) {
  this.logger.error('Category', 'Description de l\'erreur', {
    context: 'additional data'
  }, error); // Passer l'objet Error pour le stack trace
}
```

## 🔧 Maintenance et Nettoyage

### Nettoyage automatique

- **Fréquence** : Toutes les 24 heures
- **Critère** : Logs plus anciens que 24h
- **Configuration** : Modifiable via `cleanupInterval`

### Rotation des fichiers

- **Taille max** : 10MB par fichier
- **Nombre max** : 10 fichiers
- **Compression** : Automatique des anciens fichiers

### Monitoring

- **Métriques** : Collectées toutes les 5 minutes
- **Alertes** : Taux d'erreur > 5%
- **Performance** : Temps de réponse > 2s

## 🚨 Dépannage

### Problèmes courants

1. **Logs manquants**
   - Vérifier le niveau de log configuré
   - Contrôler les filtres dans l'interface admin
   - Vérifier le nettoyage automatique

2. **Performance dégradée**
   - Réduire le niveau de log en production
   - Désactiver les métriques si nécessaire
   - Augmenter l'intervalle de nettoyage

3. **Espace disque**
   - Réduire `maxFileSize` et `maxFiles`
   - Activer la compression
   - Nettoyer manuellement les anciens logs

### Commandes utiles

```bash
# Vérifier l'espace disque
df -h

# Rechercher les fichiers de logs
find . -name "*.log" -type f

# Analyser les logs d'erreur
grep "ERROR" logs/app.log | tail -20
```

## 📚 Ressources

- **Code source** : `src/app/services/logger.service.ts`
- **Interface admin** : `src/app/pages/admin/logs.page.ts`
- **Configuration** : `src/environments/environment.ts`
- **Tests** : `src/app/services/logger.service.spec.ts`

---

## 🤖 Prompt pour Cursor

```markdown
# Prompt pour amélioration du système de logging BOB

## Contexte
Je travaille sur le projet BOB (BoredOnBoard), une application Ionic/Angular pour passagers aériens. Le système de logging a été implémenté avec LoggerService et une interface d'administration.

## Objectifs
- Améliorer la performance du système de logging
- Ajouter de nouvelles fonctionnalités de monitoring
- Optimiser l'utilisation mémoire
- Améliorer l'interface d'administration

## Contraintes
- Compatibilité Ionic 6 + Angular 16
- Performance mobile optimisée
- Sécurité des données sensibles
- Interface admin responsive

## Tâches spécifiques
1. Analyser les performances actuelles du LoggerService
2. Proposer des optimisations mémoire et CPU
3. Améliorer l'interface d'administration des logs
4. Ajouter des alertes et notifications
5. Implémenter des graphiques de métriques
6. Optimiser les requêtes de filtrage

## Fichiers concernés
- src/app/services/logger.service.ts
- src/app/pages/admin/logs.page.ts
- src/app/pages/admin/logs.page.html
- src/app/pages/admin/logs.page.scss

## Critères de qualité
- Code TypeScript strict
- Tests unitaires complets
- Documentation détaillée
- Performance optimisée
- Interface utilisateur moderne
```

## 📝 Changelog

### Version 1.0.0 (2024-01-XX)
- ✅ Implémentation du LoggerService de base
- ✅ Interface d'administration des logs
- ✅ Système de métriques et statistiques
- ✅ Rotation automatique des fichiers
- ✅ Intégration avec les services existants
- ✅ Documentation complète

### Prochaines améliorations
- [ ] Graphiques de métriques en temps réel
- [ ] Système d'alertes et notifications
- [ ] Export vers services externes (Sentry, LogRocket)
- [ ] Optimisation des performances
- [ ] Tests unitaires complets 