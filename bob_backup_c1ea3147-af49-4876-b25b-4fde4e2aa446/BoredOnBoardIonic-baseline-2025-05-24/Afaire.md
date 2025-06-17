# À faire (prochaines étapes)

> [2024-06-XX] Un script de backup baseline automatisé (backup_baseline.sh) est disponible à la racine du projet pour toute sauvegarde ou rollback future.

> [2024-06-XX] Refonte du header global et de la barre utilisateur terminée et validée. Plus rien à faire sur ce point.

- [ ] Intégrer la logique de logout centralisée sur toutes les pages (UserStatusBar, menu, etc.)
- [ ] Débuter le développement fonctionnel de la page Mes Voyages (timeline, plans, statuts, filtres, responsive, synchro Firestore)
- [ ] Développement détaillé des autres pages selon le plan (voir ci-dessous)
- [ ] Amélioration UX/UI (animations, feedback visuel, accessibilité)
- [ ] Ajout d'un mode démo avec fausses données
- [ ] Intégration du parsing automatique des emails de réservation
- [ ] Notifications push (rappels, changements de statut de voyage)
- [ ] Gestion avancée du profil utilisateur (photo, préférences, etc.)
- [ ] Tests automatisés (unitaires, e2e)
- [ ] Optimisation des performances et audit sécurité
- [ ] Documentation technique et utilisateur
- [ ] Vérifier et améliorer l'affichage des voyages et des plans pour un rendu professionnel et esthétique
- [ ] Résoudre le problème des boutons de mode démo qui n'apparaissent plus sur la page de login
- [ ] Vérifier la traduction pour tout nouveau type de plan ajouté à l'avenir
- [ ] Continuer à améliorer l'UX sur mobile (responsive, accessibilité)
- [ ] Ajouter des tests automatisés sur la logique de traduction et d'affichage des plans
- [ ] Améliorer la gestion des erreurs Firestore (affichage utilisateur)

## Plan de développement des pages principales (inspiré TripIt + cahier des charges)

### 1. Mes Voyages (Dashboard)
- Timeline verticale des voyages (en cours, à venir, passés)
- Statut visuel (icônes, couleurs, progression)
- Accès rapide à chaque plan (vol, hôtel, activité, etc.)
- Ajout/édition/suppression de plans
- Filtres et recherche
- Responsive et accessible
- Synchronisation Firestore

### 2. Ma Fenêtre (Carte interactive)
- Carte Mapbox/Leaflet avec POI contextuels (Wikipedia, GeoNames)
- Vue 3D optionnelle, simulation de la position avion
- Fiches POI interactives, favoris
- Responsive, accessibilité renforcée

### 3. Chat (Réseau social embarqué)
- Détection des passagers du même vol
- Chat privé/groupe, suggestions de connexion
- Modération, confidentialité, blocage
- Notifications en temps réel

### 4. BoBBers présents
- Liste des utilisateurs à proximité (vol, aéroport)
- Matching par ID d'itinéraire ou géoloc
- Suggestions de contact, actions rapides

### 5. Jeux / Quiz
- Catalogue de jeux/quiz liés à la destination
- Matchmaking embarqué, classement, badges
- Mode offline natif

### 6. Notifications
- Liste des alertes (retards, changements, suggestions)
- Push Firebase Messaging
- Actions rapides sur chaque notification

### 7. Documents
- Accès aux documents de voyage (billets, réservations, etc.)
- Ajout, suppression, export (PDF, CSV)
- Sécurité et confidentialité

### 8. Support
- FAQ, contact direct, feedback utilisateur
- Système de tickets, suivi des demandes

### 9. Préférences
- Personnalisation avancée (thème, langue, accessibilité)
- Gestion des notifications, confidentialité
- Export des données, suppression du compte

### [2024-05-23] Améliorations à faire sur la timeline serpentin (page de test)
- Améliorer la gestion de la superposition texte/route pour une lisibilité parfaite.
- Ajouter une attache visuelle (queue, triangle, etc.) entre l'icône et le texte.
- Tester d'autres styles SVG pour un effet encore plus graphique (effet route, ombre, etc.).
- Optimiser le rendu sur tous les formats mobiles (iPhone SE, Android petits écrans).
- Ajouter une animation de progression ou d'apparition.
- Brancher sur Firestore pour données réelles.
- Permettre la personnalisation facile (palette, police, etc.).
- Documenter le composant pour réutilisation dans d'autres pages.

---

**Contraintes transverses à respecter partout :**
- Menu latéral accessible sur toutes les pages
- Accès au profil utilisateur partout (barre de statut)
- Bouton logout visible partout
- Respect strict de la charte graphique (palette turquoise/orange, responsive, accessible)
- AuthGuard sur toutes les pages protégées
- Traductions FR/EN systématiques 