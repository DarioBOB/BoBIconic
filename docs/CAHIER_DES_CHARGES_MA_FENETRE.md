# Cahier des charges – Fonctionnalité « Ma Fenêtre »

## Objectif
Proposer une expérience immersive et moderne simulant la vue par le hublot d'un avion, avec un effet "WAW" immédiat. L'application doit fonctionner de manière optimale sur mobile, avec ou sans connexion, tout en restant générique pour s'adapter à n'importe quel vol.

## Gestion des Utilisateurs

### Types d'Utilisateurs
1. **Admin** (bobplans@sunshine-adventures.net)
   - Accès complet à tous les vols
   - Gestion des POIs
   - Configuration système
   - Statistiques d'utilisation

2. **Démo** (guestuser@demo.com)
   - Vol de référence : Genève → Athènes (LX 4334)
   - Données mockées + Firebase
   - Toutes les fonctionnalités
   - Pas de limitation de temps

3. **Utilisateur Standard** (autres emails Firebase)
   - Accès à leurs vols uniquement
   - Données en temps réel
   - Mode hors ligne
   - Historique limité

### Authentification
- Firebase Authentication
- Persistance des sessions
- Gestion des tokens
- Synchronisation automatique

## Modes de Fonctionnement

### Mode Démo (guestuser@demo.com)
- **Activation** : Automatique pour l'utilisateur démo
- **Vol de Référence** : Genève → Athènes (LX 4334)
- **Données** :
  - Mockées localement
  - Stockées dans Firebase
  - Mise à jour toutes les 5 secondes
  - Cache complet préchargé
- **Fonctionnalités** :
  - Toutes les fonctionnalités disponibles
  - Pas de limitation de temps
  - Mode hors ligne complet
- **POIs** :
  - 6 POIs par tranche de 10%
  - Données enrichies (photos, descriptions)
  - Cache local des images

### Mode Vol Réel (Utilisateur Standard)
- **Activation** : Détection automatique via :
  - Email de réservation
  - API Aviationstack
  - GPS en vol
- **Données** :
  - Temps réel si connexion
  - Cache local en mode avion
  - Synchronisation automatique
- **Fonctionnalités** :
  - Même que le mode démo
  - Adaptation aux conditions réelles
  - Gestion des retards/avances

### Mode Admin
- **Activation** : Email admin uniquement
- **Fonctionnalités** :
  - Gestion des vols
  - Configuration des POIs
  - Monitoring système
  - Statistiques

## Architecture Technique
+-------------------------+        +----------------------+
|      Interface UI       |<--API--| Module de Traitement |
|  (Ionic/Angular +       |       +----------------------+
|  Capacitor Plugins)     |--DB--->| Base Locale (Cache)   |
+-------------------------+        +----------------------+
       |        |     ^                         ^
       |        |     |                         |
       V        V     |                         |
+--------------+--------+                     |
| Module Acquisition     |                     |
| (Email Parser, APIs,   |---------------------+
|  GPS via Geolocation)  |  
+------------------------+

## Technologies Utilisées
- **Framework** : Ionic/Angular 19
- **Backend** : Firebase
  - Authentication
  - Firestore
  - Storage
  - Functions
- **Plugins Capacitor** :
  - Geolocation : Position, altitude, vitesse
  - Network : État réseau (online/offline)
  - Storage/SQLite : Cache local
  - Local Notifications : Alertes
  - Secure Storage : Jetons API
  - Filesystem : Gestion fichiers
- **Bibliothèques** :
  - Leaflet/Mapbox : Cartes
  - Chart.js : Graphiques
  - Three.js : Vue 3D hublot
  - PWA : Support hors ligne

## Contraintes Techniques
- **Performance** :
  - Réponse UI < 300 ms
  - Rafraîchissement données < 500 ms
  - Rafraîchissement carte < 1 s
  - Mise à jour carte : 30 s max
- **Stockage** :
  - 10 dernières positions GPS
  - Plan de vol complet
  - Tuiles carte (±300 km)
  - Météo (10 min max)
- **GPS** :
  - Fréquence : 15 s min
  - Mode Avion : si permission
- **Réseau** :
  - États : online/offline/faible
  - Bascule automatique
- **APIs** :
  - Aviationstack : données vol
  - OpenSky : ADS-B
  - OpenWeatherMap : météo

## Contraintes Utilisateurs
- **Profils** : 8-85 ans
- **Accessibilité** :
  - Contraste ≥ 4.5:1
  - Police ≥ 16px
  - Boutons ≥ 44px
- **Navigation** :
  - Tactile : pinch/pan/tap
  - Non-tactile : boutons/flèches
- **Internationalisation** :
  - FR/EN
  - Unités locales
- **Notifications** :
  - Toasts : messages brefs
  - Popovers : détails
  - Transitions < 200ms

## Contraintes Environnementales
- **Luminosité** :
  - ≥ 200 nits (mobile)
  - ≥ 300 nits (IFE)
  - Mode nuit automatique
- **Vibrations** :
  - Pas d'animations sensibles
  - Test sur simulateur
- **Son** :
  - Info visuelle prioritaire
  - Volume indépendant

## Fonctionnalités principales

### 1. Page à onglets
- Trois onglets :
  1. **Données textuelles sur le vol**
  2. **Carte interactive**
  3. **Vue par les hublots**

### 2. Données textuelles sur le vol
- Trois sections :
  1. **Données générales du vol**
     - Numéro de vol (ex : LX 4334)
     - Compagnie aérienne
     - Aéroports de départ et d'arrivée
     - Date et heure de départ
     - Durée du vol
     - Statut du vol
     - Type d'avion
  2. **Données dynamiques de vol**
     - Altitude
     - Vitesse
     - Position GPS
     - Météo
     - Temps restant estimé
  3. **POIs (Points d'intérêt)**
     - Villes, monuments, reliefs survolés

### 3. Carte interactive
- Affichage d'une carte satellite (Esri World Imagery)
- Initialisation forcée au chargement de l'onglet
- Marqueurs fixes :
  - Aéroport de départ (icône personnalisée)
  - Aéroport d'arrivée (icône personnalisée)
- Trajet de vol :
  - Courbe réaliste basée sur les segments
  - Extrapolation pour les segments manquants
  - Trait plein : parcours effectué
  - Pointillés : parcours restant
- Position de l'avion dynamique
- Icône orientée selon le cap (24 images, 15°)
- Zoom automatique selon altitude :
  - >30,000 ft : zoom 7
  - 20-30,000 ft : zoom 8
  - 10-20,000 ft : zoom 10
  - <10,000 ft : zoom 12
- Bouton "Vue auto (zoom altitude)"

### 3bis. Animation fluide de la position de l'avion
- Timer d'animation (10 FPS)
- Interpolation linéaire entre segments
- Saut à la position du slider si déplacé
- Mise à jour dynamique du marqueur
- Gestion de l'initialisation de la carte
- Rafraîchissement forcé au changement d'onglet

### 4. Vue par les hublots
- Vue panoramique 360° (Three.js)
- POIs visibles (gauche/droite)
- Altitude et vitesse en superposition
- Météo en temps réel
- Mode nuit automatique

### 5. Saisie et affichage de la progression
- Slider pour les 3 onglets
- % réel et % simulé
- Adaptation dynamique des horaires

### 6. Segments de vol détaillés
- 101 segments (0-100%, 1% chacun)
- Coordonnées, altitude, vitesse, temps, heading
- Mise en évidence du segment actif

### 7. Points d'intérêt (POIs)
- 6 POIs par tranche de 10%
- 3 à gauche, 3 à droite
- Nom, type, coordonnées, photo, descriptif
- Zoom selon altitude

## Plan d'action détaillé

### Phase 1 : Refactoring (Semaine 1-2)
1. **Architecture**
   - [ ] Restructuration des composants
   - [ ] Intégration Firebase
   - [ ] Gestion des utilisateurs

2. **Base de données**
   - [ ] Schéma Firestore
   - [ ] Cache local SQLite
   - [ ] Synchronisation

3. **Sécurité**
   - [ ] Règles Firestore
   - [ ] Gestion des tokens
   - [ ] Validation des entrées

### Phase 2 : Fonctionnalités (Semaine 3-4)
1. **Vue Hublot**
   - [ ] Implémentation Three.js
   - [ ] Effets visuels
   - [ ] Mode nuit

2. **Carte Interactive**
   - [ ] Optimisation performances
   - [ ] Couches météo
   - [ ] Zoom dynamique

3. **POIs**
   - [ ] Système de cache
   - [ ] Enrichissement données
   - [ ] Affichage optimisé

### Phase 3 : Optimisation (Semaine 5-6)
1. **Performance**
   - [ ] Lazy loading
   - [ ] Compression données
   - [ ] Gestion mémoire

2. **UX/UI**
   - [ ] Animations fluides
   - [ ] Transitions
   - [ ] Responsive design

3. **Mode Hors Ligne**
   - [ ] PWA
   - [ ] Cache complet
   - [ ] Synchronisation

### Phase 4 : Tests et Déploiement (Semaine 7-8)
1. **Tests**
   - [ ] Unitaires
   - [ ] E2E
   - [ ] Performance

2. **Documentation**
   - [ ] Technique
   - [ ] Utilisateur
   - [ ] API

3. **Déploiement**
   - [ ] App Store
   - [ ] Play Store
   - [ ] Web

## Modifications en cours

### Fait
1. ✅ Carte interactive (Leaflet)
   - Satellite view
   - Avion orienté
   - Zoom dynamique
2. ✅ Animation fluide
   - Timer 10 FPS
   - Interpolation
   - Sauts slider
3. ✅ POIs de base
   - 6 par tranche
   - Gauche/droite
   - Zoom adapté

### En cours
1. 🔄 Vue hublot (Three.js)
   - Skybox
   - POIs 3D
   - Transitions
2. 🔄 Météo temps réel
   - Radar
   - Prévisions
   - Cache
3. 🔄 Carte interactive
   - Marqueurs aéroports
   - Courbe de trajet
   - Initialisation forcée

### À faire
1. 📝 Mode nuit
   - Détection
   - Thème sombre
   - Transitions
2. 📝 Export données
   - CSV
   - JSON
   - PDF
3. 📝 Tests
   - Unitaires
   - E2E
   - Performance
4. 📝 Documentation
   - Utilisateur
   - Technique
   - API

## Notes de développement
- L'application doit être robuste et fonctionner en mode hors ligne
- L'expérience utilisateur doit être fluide et immersive
- Le code doit être maintenable et évolutif
- La sécurité est une priorité absolue
- Les performances doivent être optimales sur mobile
- Tous les algorithmes doivent être génériques
- Le mode démo doit créer un vol dans Firebase
- Les données doivent être synchronisées localement

---
*Ce document doit être mis à jour à chaque nouvelle instruction concernant la fonctionnalité « Ma Fenêtre ». Les modifications doivent être validées par l'équipe de développement.* 