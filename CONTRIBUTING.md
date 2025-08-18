# Guide de Contribution - BoredOnBoard (BOB)

## 🎯 Vue d'ensemble

Ce guide décrit les bonnes pratiques et le workflow de contribution pour le projet BoredOnBoard (BOB), une application Ionic/Angular de gestion de voyages aériens.

## 📋 Prérequis

- Node.js (version 18 ou supérieure)
- npm (version 9 ou supérieure)
- Git
- Connaissance d'Angular/Ionic
- Compte Firebase (pour les tests)

## 🚀 Installation et configuration

### 1. Cloner le projet
```bash
git clone https://github.com/DarioBOB/BoBIconic.git
cd BoBIconic
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration Firebase
- Créer un projet Firebase
- Configurer Authentication (Email/Password)
- Configurer Firestore avec les règles de sécurité
- Mettre à jour `environment.ts` avec vos clés

### 4. Configuration du backend FR24
```bash
# Installer les dépendances Python
pip install flask flask-cors pyflightdata requests

# Lancer le serveur backend
python fr24_server.py
```

## 🔧 Workflow de développement

### 1. Créer une branche
```bash
# Toujours partir de la branche principale
git checkout main
git pull origin main

# Créer une branche pour votre fonctionnalité
git checkout -b feature/nom-de-la-fonctionnalite
```

### 2. Développer
- Suivre les conventions de code (voir section ci-dessous)
- Tester votre code localement
- Documenter les changements importants

### 3. Commiter
```bash
# Ajouter les fichiers modifiés
git add .

# Commiter avec un message descriptif
git commit -m "feat: ajouter gestion du cache local pour les voyages

- Implémentation du cache avec Ionic Storage
- Fallback automatique en cas d'erreur réseau
- Tests de robustesse ajoutés"
```

### 4. Pousser et créer une Pull Request
```bash
git push origin feature/nom-de-la-fonctionnalite
```

## 📝 Conventions de code

### Structure des fichiers
- **Noms de fichiers** : kebab-case (ex: `trips.page.ts`, `window.service.ts`)
- **Noms de classes** : PascalCase (ex: `TripsPage`, `WindowService`)
- **Noms de méthodes** : camelCase (ex: `loadTrips`, `searchFlight`)
- **Constantes** : UPPER_SNAKE_CASE (ex: `MAX_CACHE_AGE`, `DEFAULT_LANGUAGE`)
- **Interfaces** : PascalCase (ex: `UserRole`, `FlightData`)

### Organisation du code
```typescript
// 1. Imports (groupés par type)
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

// 2. Interfaces et types
interface Trip {
  id: string;
  title: string;
  // ...
}

// 3. Décorateur du composant
@Component({
  selector: 'app-trips',
  templateUrl: './trips.page.html',
  styleUrls: ['./trips.page.scss'],
  standalone: true,
  imports: [IonicModule, TranslateModule]
})

// 4. Classe avec commentaires JSDoc
export class TripsPage implements OnInit {
  // 5. Propriétés publiques
  trips: Trip[] = [];
  
  // 6. Propriétés privées
  private userId: string | null = null;
  
  // 7. Constructeur
  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}
  
  // 8. Méthodes du cycle de vie
  ngOnInit() {
    // ...
  }
  
  // 9. Méthodes publiques
  async loadTrips() {
    // ...
  }
  
  // 10. Méthodes privées
  private async validateTripData(data: any): Promise<boolean> {
    // ...
  }
}
```

### Commentaires et documentation
```typescript
/**
 * Charge les voyages de l'utilisateur depuis Firestore
 * avec fallback sur le cache local en cas d'erreur réseau
 * 
 * @returns Promise<void>
 * @throws Error si la récupération échoue complètement
 */
async loadTrips(): Promise<void> {
  // Implémentation...
}
```

### Gestion des erreurs
```typescript
try {
  // Code susceptible d'échouer
  const result = await this.someAsyncOperation();
} catch (err) {
  // Log avec contexte
  console.error('[Trips] Erreur lors du chargement:', {
    userId: this.userId,
    action: 'loadTrips',
    error: err.message
  });
  
  // Notifier l'utilisateur
  await this.showErrorToast('TRIPS.ERROR_LOADING');
  
  // Fallback si possible
  await this.loadFromCache();
}
```

## 🧪 Tests et qualité

### Tests manuels obligatoires
Avant chaque commit, tester :
- [ ] Mode connecté (Firestore OK)
- [ ] Mode offline (cache uniquement)
- [ ] Mode démo
- [ ] Utilisateur admin
- [ ] Utilisateur standard
- [ ] Changement de langue (FR/EN)
- [ ] Gestion des erreurs réseau

### Tests de sécurité
- [ ] Vérifier que l'utilisateur standard ne voit que ses voyages
- [ ] Vérifier que l'admin voit tous les voyages
- [ ] Vérifier que le mode démo affiche les données de démo
- [ ] Tester les accès non autorisés

### Tests de robustesse
- [ ] Simuler des erreurs réseau
- [ ] Tester le fallback cache
- [ ] Vérifier les messages d'erreur
- [ ] Tester l'expiration du cache

## 🌐 Internationalisation

### Ajouter des traductions
1. Identifier la clé de traduction dans le code
2. Ajouter la clé dans `src/assets/i18n/fr.json`
3. Ajouter la clé dans `src/assets/i18n/en.json`
4. Utiliser le pipe `translate` dans le template

```typescript
// Dans le code TypeScript
this.translate.instant('TRIPS.ERROR_LOADING');

// Dans le template HTML
<p>{{ 'TRIPS.NO_ONGOING' | translate }}</p>
```

### Formats de date et nombres
```typescript
// Utiliser les pipes Angular avec la locale
{{ date | date:'EEEE d MMMM yyyy à HH:mm':'':'fr' }}
{{ number | number:'1.0-0' }}
```

## 🔒 Sécurité

### Gestion des rôles utilisateur
- Toujours vérifier les permissions avant d'accéder aux données
- Utiliser les méthodes `checkAccess()` et `loadUserRole()`
- Respecter la séparation admin/demo/standard

### Validation des données
- Valider toutes les données entrantes
- Utiliser les méthodes `validateTripData()` et `validatePlanData()`
- Filtrer les données invalides

### Règles Firestore
- Respecter les règles de sécurité définies
- Tester les accès avec différents rôles
- Ne jamais exposer de données sensibles

## 📊 Performance

### Optimisations recommandées
- Utiliser le cache local pour les données fréquemment consultées
- Limiter les requêtes Firestore
- Optimiser les requêtes avec des index appropriés
- Utiliser la pagination pour les grandes listes

### Monitoring
```typescript
// Ajouter des logs de performance
console.log('[Trips] Performance:', {
  action: 'loadTrips',
  duration: Date.now() - startTime,
  itemCount: trips.length
});
```

## 📚 Documentation

### Mise à jour de la documentation
- Documenter les nouvelles fonctionnalités dans `Documentation BoB.txt`
- Mettre à jour les fichiers de suivi (`CHANGES.md`, `DONE_TRIPS.md`)
- Ajouter des exemples de code si nécessaire

### Fichiers de suivi
- `docs/tracking/PLAN_ACTIONS_TRIPS.md` - Plan d'actions
- `docs/tracking/TODO_TRIPS.md` - Tâches à faire
- `docs/tracking/DONE_TRIPS.md` - Tâches terminées
- `docs/tracking/CHANGES.md` - Historique des changements

## 🚀 Déploiement

### Build de production
```bash
# Build Angular
npm run build

# Test local du build
ionic serve --prod

# Déploiement Firebase
firebase deploy
```

### Variables d'environnement
- Vérifier `environment.ts` et `environment.prod.ts`
- Ne jamais commiter de clés API sensibles
- Utiliser des variables d'environnement pour la production

## 🤝 Messages de commit

Utiliser le format conventionnel :
```
type(scope): description courte

Description détaillée si nécessaire

- Point 1
- Point 2
- Point 3
```

### Types de commit
- **feat** : nouvelle fonctionnalité
- **fix** : correction de bug
- **docs** : documentation
- **style** : formatage, point-virgules manquants, etc.
- **refactor** : refactorisation du code
- **test** : ajout ou modification de tests
- **chore** : mise à jour de build, dépendances, etc.

### Exemples
```bash
git commit -m "feat(trips): ajouter gestion du cache local

- Implémentation du cache avec Ionic Storage
- Fallback automatique en cas d'erreur réseau
- Tests de robustesse ajoutés"

git commit -m "fix(window): corriger l'affichage des données météo

- Correction du parsing METAR
- Amélioration de la gestion des erreurs
- Ajout de logs pour le debug"
```

## ✅ Checklist avant commit

- [ ] Code fonctionne et passe les tests
- [ ] Documentation mise à jour si nécessaire
- [ ] Fichiers de suivi mis à jour
- [ ] Messages d'erreur traduits
- [ ] Gestion des cas d'erreur
- [ ] Respect des conventions de code
- [ ] Tests de sécurité effectués
- [ ] Performance acceptable

## 🆘 Support et questions

Pour toute question ou problème :
1. Consulter la documentation principale (`Documentation BoB.txt`)
2. Vérifier les fichiers de suivi dans `docs/tracking/`
3. Créer une issue sur GitHub avec le template approprié
4. Contacter l'équipe de développement

---

**Merci de contribuer au projet BoredOnBoard !** 🛩️ 

# Règles de collaboration IA / Humain

- L'utilisateur (humain) **ne touche jamais au code** : seul l'agent IA (ChatGPT) réalise les modifications, corrections, refactoring, etc.
- **Aucune action ne doit être faite en background** ou sans retour immédiat à l'utilisateur. Toute commande, modification ou analyse doit être explicitement expliquée et validée étape par étape.
- **Transparence totale** : chaque étape, chaque correction, chaque analyse doit être expliquée en temps réel à l'utilisateur.
- Ces règles sont à respecter pour toute la durée du projet et doivent être rappelées à chaque nouvelle session.

--- 

## 🚦 Bonnes pratiques CI/CD et gestion des secrets

- **Ne jamais commiter de secrets** (API keys, tokens, mots de passe, etc.) dans le code. Utilisez `.env` (ignoré par git) et les secrets GitHub Actions.
- **CI/CD** : À chaque push sur `main`, le pipeline build, teste, déploie (Firebase Hosting, Firestore rules/indexes) et sauvegarde le code (zip local + artefact).
- **Restaurer un backup** : Télécharger l'artefact `project-backup` depuis GitHub Actions et dézipper dans un dossier vide.
- **Modifier les règles Firestore** : Éditer `firestore.rules` puis pousser sur `main` pour déploiement automatique.

--- 