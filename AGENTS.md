# Spécifications Techniques pour le Développement de BoB (Bored On Board)

## 1. Architecture Globale

### 1.1 Stack Technique
- Framework: Ionic/Angular 19
- Base de données: Firebase (Authentication, Firestore, Storage)
- APIs externes: Aviationstack, OpenSky, OpenWeatherMap
- Plugins Capacitor: Geolocation, Network, Storage, Notifications, Screenshot, Social Sharing

### 1.2 Types d'Utilisateurs
1. **Admin** (bobplans@sunshine-adventures.net)
   - Accès complet à tous les vols
   - Gestion des POIs
   - Configuration système
   - Statistiques d'utilisation

2. **Démo** (guestuser@demo.com)
   - Vol de référence: Genève → Athènes (LX 4334)
   - Données mockées + Firebase
   - Toutes les fonctionnalités
   - Pas de limitation de temps

3. **Utilisateur Standard**
   - Accès à leurs vols uniquement
   - Données en temps réel
   - Mode hors ligne
   - Historique limité

## 2. Fonctionnalités Principales

### 2.1 Authentification & Profil
- Firebase Authentication avec:
  - Email/Mot de passe
  - Google
  - Facebook
  - LinkedIn
- Gestion des sessions persistantes
- Profil utilisateur (Firestore)
- Synchronisation automatique des données

### 2.2 Module "Ma Fenêtre"
#### 2.2.1 Vue Hublot
- Simulation 3D de la vue par le hublot
- Animation fluide (≥30 fps tablette, ≥25 fps mobile)
- Adaptation à l'altitude
- Mode jour/nuit automatique
- Capture d'écran et partage

#### 2.2.2 Carte Interactive
- Intégration Mapbox/Esri World Imagery
- Marqueurs fixes (aéroports)
- Trajectoire de vol
- POIs géolocalisés
- Couches météo (pluie, orage, neige)
- Mode hors ligne avec cache

#### 2.2.3 Données de Vol
- Informations statiques:
  - Numéro de vol
  - Compagnie
  - Aéroports
  - Horaires
  - Type d'avion
- Données dynamiques:
  - Altitude
  - Vitesse
  - Position GPS
  - Météo
  - ETA
- POIs:
  - Villes
  - Monuments
  - Reliefs
  - Photos et descriptions

### 2.3 Gestion des Vols
- Recherche par numéro de vol
- Import automatique via email
- Historique des vols
- Mode hors ligne
- Synchronisation Firebase

### 2.4 Réseau Social
- Détection des passagers sur même vol
- Chat en temps réel
- Demandes d'amis
- Partage de position
- Notifications push

### 2.5 Divertissement
- Quiz thématiques
- Jeux multijoueurs
- Matchmaking local
- Mode hors ligne

## 3. Exigences Techniques

### 3.1 Performance
- Temps de réponse <300ms
- Rafraîchissement données <500ms
- Chargement carte <3s
- Empreinte mémoire <250Mo
- Démarrage <5s

### 3.2 Sécurité
- Chiffrement AES256
- Secure Storage pour tokens
- CSP et CORS stricts
- Validation des données

### 3.3 Compatibilité
- Android ≥10 (SDK 29)
- iOS ≥13
- Support IFE non tactile
- Responsive design

### 3.4 Mode Hors Ligne
- Cache complet des données
- Synchronisation automatique
- GPS local
- Notifications locales

## 4. APIs et Services

### 4.1 Aviationstack
- Données de vol
- Statut des vols
- Informations aéroports
- Historique (7 jours)

### 4.2 OpenSky
- Position en temps réel
- Trajectoires
- Données aéronefs
- Historique (30 jours)

### 4.3 OpenWeatherMap
- Conditions météo
- Prévisions
- Alertes
- Données historiques

## 5. Tests et Qualité

### 5.1 Tests Unitaires
- Couverture ≥85%
- Tests des services
- Validation des données
- Gestion des erreurs

### 5.2 Tests d'Intégration
- Validation des APIs
- Synchronisation Firebase
- Mode hors ligne
- Performance

### 5.3 Tests Utilisateurs
- Panel 20 passagers
- Scénarios complets
- Mesures de performance
- Feedback utilisateur

## 6. Livrables

### 6.1 Code Source
- Structure Angular/Ionic
- Services et composants
- Tests unitaires
- Documentation

### 6.2 Documentation
- Guide d'installation
- API documentation
- Guide utilisateur
- Guide administrateur

### 6.3 Déploiement
- Configuration Firebase
- Variables d'environnement
- Scripts de build
- Procédures de déploiement 