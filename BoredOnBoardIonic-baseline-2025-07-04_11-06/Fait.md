# Fait

## [Livrable du jour]
- **Correction majeure du mode Démo :**
  - **Fiabilisation des données :** Le script `load-demo-trips.js` a été entièrement revu pour créer une base de données démo propre, cohérente et avec des dates relatives préservées (inspiré du script `seed demo.txt`).
  - **Calcul dynamique en mémoire :** La logique de `demo.service.ts` ne modifie plus la base de données. Elle lit les données "modèles" et recalcule en mémoire les dates des voyages pour que la démo soit toujours pertinente (passé / présent / futur) sans altérer les données sources.
  - **Correction de bugs :** Résolution de l'erreur `Invalid time value` liée à la manipulation des Timestamps Firestore.

## [2024-06-10]
- Affichage dynamique et multilingue des voyages démo et réels
- Timeline stylée avec plans détaillés (vol, hôtel, activité...)
- Gestion robuste des erreurs plans (affichage localisé)
- Correction des règles Firestore pour accès plans
- Affichage enrichi des détails de chaque plan
- UI/UX modernisée et responsive

# Suivi des évolutions récentes

- Modernisation complète de la page de login : gestion des langues, erreurs, rôles, mode démo, redirections
- Intégration du service DemoService pour le mode démo
- Affichage du logo, image de fond, baseline sous le logo, et icônes SVG inline
- Correction de l'erreur Firebase "api-key-not-valid" (mise à jour des fichiers d'environnement)
- Correction du routage du bouton Home dans le header (navigation programmatique vers /landing-tiles)
- Remplacement des balises <ion-icon> par des SVG inline dans les headers et la page profile
- Ajout d'un guard RedirectIfAuthenticatedGuard pour la gestion de la session et la redirection automatique si déjà connecté
- Scripts de backup/restore (PowerShell et Bash) ajoutés et adaptés pour garantir la conservation de la structure du projet dans l'archive ZIP
- Correction du push GitLab (optionnel) et gestion des fichiers ouverts lors de la compression
- Correction du script PowerShell pour zipper la structure complète du projet
- Suppression des headers custom et boutons de test une fois le routage corrigé sur la page profile
- Tests manuels validés : login, logout, navigation, changement de langue, accès profil, menu, backup/restore 