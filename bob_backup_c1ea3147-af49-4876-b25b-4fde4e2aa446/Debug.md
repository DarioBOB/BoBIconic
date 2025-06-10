# Debug

## [2024-06-10]
- Résolution : Erreur d'accès aux plans (Missing or insufficient permissions) corrigée par mise à jour des règles Firestore (vérification ownership via tripId)
- Gestion d'erreur localisée : l'erreur de chargement des plans s'affiche maintenant uniquement dans la section du voyage concerné

## [2024-06-XX] Modernisation de la page de login et gestion des langues
- Ajout du selecteur de langue FR/EN sur la page de login, persistance dans localStorage
- Correction du reset automatique des champs email/mot de passe à chaque affichage de la page de connexion
- Correction du switch FR/EN (rechargement forcé des traductions à chaque changement de langue)
- Gestion des erreurs Firebase (api-key-not-valid, user-not-found, etc.) avec mapping explicite
- Résultat : plus de page blanche, traduction dynamique, sécurité/UX renforcées

## [2024-06-XX] Problème d'affichage des icônes (Ionicons)
- Symptôme : les icônes ne s'affichaient plus sur certaines pages (header, profile, etc.)
- Correction : remplacement des balises <ion-icon> par des SVG inline pour garantir l'affichage sur toutes les plateformes
- Résultat : affichage correct des icônes sur toutes les pages

## [2024-06-XX] Problème de routage du bouton Home dans le header
- Symptôme : le bouton Home ne redirigeait pas vers la bonne page sur admin/profile
- Correction : harmonisation de la navigation du bouton Home pour pointer vers /landing-tiles via navigation programmatique
- Résultat : navigation cohérente sur toutes les pages

## [2024-06-XX] Scripts de backup/restore et structure du projet
- Ajout et adaptation des scripts backup_baseline.sh et backup_baseline.ps1 pour garantir la conservation de la structure du projet dans l'archive ZIP
- Correction : création d'un dossier temporaire pour l'exclusion des fichiers/dossiers indésirables avant la compression
- Ajout d'un script de restauration capable de restaurer automatiquement le dernier backup si aucun argument n'est fourni
- Résultat : backup/restore fiable, structure fidèle

## [2024-06-XX] Problèmes GitLab (branche protégée, push)
- Correction : le push GitLab est rendu optionnel dans les scripts, le backup zip reste toujours créé
- Résultat : plus de blocage sur branche protégée, backup toujours disponible

## [2024-06-XX] Guard de redirection si déjà connecté
- Mise en place d'un guard RedirectIfAuthenticatedGuard pour rediriger automatiquement un utilisateur connecté vers /landing-tiles s'il tente d'accéder à la page de login ou d'inscription
- Résultat : persistance de la connexion, UX fluide

## Problèmes connus
- Les boutons de mode démo ne sont plus visibles sur la page de login (à corriger)
- L'affichage des voyages et des plans nécessite une amélioration visuelle et professionnelle

# DEBUG - Page Mes Voyages

## Problème : Traduction dynamique du titre de vol non réactive
- Symptôme : Le titre du voyage de type vol reste en anglais même si l'interface est en français.
- Tentatives :
  - Utilisation de this.translate.instant dans le TS → non réactif au changement de langue.
  - Utilisation du pipe translate dans le template avec paramètres → non réactif, reste en anglais.
  - Vérification des clés dans les fichiers de langue → OK.
- Hypothèses :
  - Problème de timing ou de cache ngx-translate.
  - Problème de structure des données ou de détection du type de voyage.
- Statut : Non résolu, à investiguer plus tard.

## Autres bugs/fixes
- Suppression du pipe custom de traduction (résolu)
- Problèmes de routage (résolu)
- Problèmes d'imports de modules standalone (résolu) 