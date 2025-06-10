## [2024-06-XX] Bug critique : page blanche sur pipe de traduction
- Symptôme : page blanche dès qu'un pipe de traduction était utilisé dans un composant standalone
- Cause : HttpClientModule n'était pas injecté globalement (nécessaire pour les services utilisés dans les standalones)
- Correction : ajout de importProvidersFrom(HttpClientModule) dans main.ts
- Ajout de logs détaillés dans TranslateService pour traçabilité
- Correction du reset automatique des champs email/mot de passe à chaque affichage de la page de connexion
- Correction du switch FR/EN (rechargement forcé des traductions à chaque changement de langue)
- Résultat : plus de page blanche, traduction dynamique, sécurité/UX renforcées

## [2024-06-XX] Problèmes de performance et boucles infinies - Page Mes Voyages
- Symptômes :
  - L'interface se figeait avec beaucoup de plans
  - Boucles infinies lors de l'affichage des détails
  - Erreurs TypeScript sur l'accès aux propriétés dynamiques
- Actions :
  - Identification des appels de méthodes dans le template causant des boucles
  - Pré-calcul des détails des plans pour éviter les calculs dans le template
  - Correction des accès aux propriétés dynamiques avec bracket notation
  - Optimisation de la gestion des dates (Firestore Timestamp, Date, string)
- Résultats :
  - Interface fluide même avec beaucoup de plans
  - Plus de boucles infinies
  - Code TypeScript conforme
  - Meilleure gestion des cas d'erreur
- Validation :
  - Tests de performance avec beaucoup de plans
  - Vérification des cas limites
  - Tests de traduction FR/EN
  - Validation de l'affichage des détails complexes

## [2024-06-XX] Problème d'envoi d'email de vérification/réinitialisation
- Symptôme : email non reçu sur Yahoo avec SMTP Firebase natif ou personnalisé
- Actions :
  - Test SMTP Zoho direct (Node.js) : OK, délivrabilité confirmée
  - Test avec Gmail/Outlook : OK
  - Vérification des spams, logs Zoho, configuration SMTP
  - Ajout de feedback utilisateur et logs dans l'app
- Résultat : problème de délivrabilité Yahoo, SMTP Zoho fonctionnel, feedback utilisateur amélioré
- Correction : feedback utilisateur sur reset password, mapping d'erreur, logs
- Validation : Test complet du flux de réinitialisation de mot de passe réussi
  - Email de réinitialisation reçu et délivré correctement
  - Lien de réinitialisation fonctionnel
  - Modification du mot de passe réussie
  - Redirection correcte après modification

## [2024-06-XX] Problème création utilisateur résolu
- Symptôme : Erreur 400 lors de la tentative d'écriture dans Firestore (base non créée)
- Action : Création de la base Firestore via la console Firebase
- Résultat : Création de compte, envoi et réception de l'email de vérification, validation OK
- Statut : Succès, flux complet validé

## [2025-05-17] Problème parsing universel → Firestore (plans)
- Action : Exécution du script bobparser-ai.js, aucune donnée n'apparaît dans la collection plans de Firestore.
- Résultat : Échec initial, pas d'erreur logguée, pas de plan inséré.
- Logs / Détails :
    - Ajout de logs détaillés sur chaque tentative d'écriture Firestore (succès/échec, contenu du plan, collection cible).
    - Ajout d'un plan de test inséré si aucun plan n'est extrait (pour valider la chaîne technique).
    - Test d'écriture Firestore minimal via un script dédié (test-firestore.js) : succès immédiat, plan inséré dans plans.
    - Correction de la gestion asynchrone dans bobparser-ai.js : utilisation de Promise.all pour attendre toutes les écritures Firestore avant la fin du process.
- Problème identifié : Les écritures Firestore étaient lancées sans être attendues (asynchrone mal géré), donc rien n'était inséré malgré l'absence d'erreur.
- Solution proposée / Prochaine étape : Correction asynchrone appliquée, la collection plans est bien créée et le plan de test est inséré. Prêt à valider le parsing réel sur des emails.
- Résolu : Correction du bug Firestore (valeur undefined dans metadata). Les plans et trips sont maintenant bien stockés après parsing email.

## [2024-06-XX] Diagnostic et correction parsing universel
- Problème : le parsing du mail ne produisait aucun plan, pas de log OpenAI
- Actions :
  - Ajout de logs détaillés (buffer, décodage, prompt, réponse OpenAI, erreurs JSON)
  - Décodage quoted-printable du mail avant envoi à OpenAI
  - Correction de la gestion asynchrone du flux IMAP
  - Contrôle explicite de la clé OPENAI_API_KEY
- Statut : prêt à valider sur mails réels

Pour la documentation complète du parsing (structure, logs, robustesse, prompt IA), voir docs/parsing/README_parsing.md

- Diagnostic et correction : problème d'affichage des voyages résolu (userId = UID Firebase Auth, dates en Timestamp, logs front pour debug).
- Bug d'affichage des voyages : Firestore renvoyait bien les documents, mais le mapping front ne convertissait pas les Timestamp en Date JS. Correction appliquée, affichage OK, flux complet validé (UID, parsing, Firestore, front).
- [TRIPS] Correction : le tri par date des voyages fonctionne, bug d'affichage résolu (FormsModule pour ngModel sur ion-segment). Ajout de logs pour le debug des catégories de voyages.
- [TRIPS] Règle métier appliquée : la date de début d'un voyage = 1er plan, la date de fin = dernier plan. Toute modification/ajout de plan ajuste automatiquement le voyage. Règle immuable.

## [2024-06-XX] Intégration FlightRadar24 et enrichissement IA
- Problèmes initiaux :
  - Rate limiting de l'API FR24
  - Timeouts sur les appels API
  - Données manquantes dans les plans
  - Performance dégradée avec beaucoup de vols
- Solutions :
  - Mise en place d'un système de cache pour FR24
  - Gestion des timeouts et retries
  - Enrichissement asynchrone des plans
  - Optimisation des appels API
- Détails techniques :
  - Cache Redis pour les données FR24 (TTL 5min)
  - Queue de mise à jour asynchrone
  - Fallback sur données statiques si API indisponible
  - Logs détaillés des appels API et enrichissements
- Validation :
  - Tests de charge avec 100+ vols simultanés
  - Vérification de la fraîcheur des données
  - Monitoring des performances
  - Gestion des cas d'erreur API

## [2024-06-XX] Suppression des erreurs CORS et robustesse accrue
- Tous les appels à FlightRadar24 passent désormais par un proxy backend sécurisé.
- Plus aucune erreur CORS côté frontend.
- Gestion centralisée des erreurs d'API et des logs.
- Fallback automatique si enrichissement impossible.
- Rapidité accrue grâce au cache backend (5 min).
- Architecture prête pour l'ajout d'autres APIs externes.

## [2024-06-XX] Double bandeau et affichage du nom/prénom dans la barre utilisateur
- Problème : Double affichage de la barre utilisateur (header) sur les pages internes (chat, bobbers, profil, etc.), avec un hamburger inutile à côté du nom/prénom.
- Analyse : Chaque page incluait sa propre barre utilisateur alors que le header global l'affichait déjà. Le bouton menu (hamburger) était redondant et source de confusion.
- Correction : Suppression de tous les <app-user-status-bar> dans les pages internes. Le header global gère désormais seul l'affichage du menu, du profil, du nom/prénom et de la déconnexion.
- Suppression du bouton menu (hamburger) dans la barre utilisateur.
- Résultat : Un seul header cohérent sur toutes les pages, affichage correct du prénom/nom, plus de redondance ni de confusion UX.
- Validation : Tests manuels sur toutes les pages, UX validée.

## Problèmes connus
- Les boutons de mode démo ne sont plus visibles sur la page de login
- L'affichage des voyages et des plans nécessite une amélioration visuelle et professionnelle

### [2024-05-23] Difficultés rencontrées sur la timeline serpentin
- Superposition du texte avec la route sur certains points du SVG.
- Placement précis des badges/icônes difficile à automatiser pour tous les cas.
- Responsive complexe avec SVG sinueux et alternance.
- Difficile d'obtenir un effet 100% fidèle à l'image d'inspiration uniquement avec HTML/CSS/SVG natif.
- Nécessité de compromis entre effet graphique et robustesse du code.

# Debug / Historique

- [2024-05-16] Correction du flicker du message 'Aucune étape' pendant le chargement des plans (spinner uniquement)
- [2024-05-16] Correction de la traduction dynamique des types de plans (badges bleus)
- [2024-05-16] Suppression du délai artificiel de chargement des plans
- [2024-05-16] Ajout automatique des clés de traduction manquantes dans fr.json et en.json 