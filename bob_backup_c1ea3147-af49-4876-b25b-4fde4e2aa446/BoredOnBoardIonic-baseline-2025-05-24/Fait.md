# Suivi des évolutions récentes

- Correction de la redirection après login : le bouton "Se connecter" redirige désormais vers la page des tuiles (/landing) et non plus /home
- Création de la page Profil utilisateur (accès partout via la barre de statut)
- Ajout du menu latéral et du bouton logout sur toutes les pages principales (landing, placeholders, profil, etc.)
- Amélioration de la visibilité du bouton logout et du bouton profil dans la UserStatusBar
- Respect strict de la charte graphique (palette turquoise/orange, responsive, accessibilité)
- Navigation cohérente et sécurisée (authGuard sur toutes les pages)
- Traductions FR/EN pour toutes les nouvelles fonctionnalités
- Tests manuels validés : login, logout, navigation, changement de langue, accès profil, menu, placeholders
- Création des squelettes de toutes les pages principales derrière les tuiles (voyages, fenêtre, chat, bobbers, jeux, notifications, documents, support, préférences)
- Chaque page inclut : UserStatusBar (profil, logout, menu), menu latéral complet, placeholder stylé, FR/EN, respect de la charte graphique, prêt pour authGuard, responsive, accessibilité
- Prêt à intégrer la logique de logout centralisée et à démarrer le développement fonctionnel de chaque page
- Ajout du changement de langue dynamique (FR/EN) sur la page d'inscription : le select applique immédiatement la langue à l'UI et la persiste dans localStorage
- Initialisation automatique de la langue utilisateur au démarrage de l'app (lecture localStorage ou navigateur, application via TranslateService)
- Ajout d'un feedback utilisateur (succès/erreur) sur le bouton "Mot de passe oublié ?" (reset password)
- Mapping d'erreur utilisateur pour les cas d'email inconnu ou de credential invalide (message explicite)
- Correction et robustesse du flux d'authentification (création, connexion, reset)
- Correction : bobparser-ai.js n'envoie plus de valeurs undefined à Firestore (plans et trips), ce qui permet l'écriture sans erreur et la création effective des documents.
- Création du document de référence parsing (docs/parsing/README_parsing.md) : structure, enrichissement, robustesse, prompt IA, exemples. À consulter pour toute évolution ou debug du backend.
- Correction : mapping userId = UID Firebase Auth pour les voyages, conversion des dates en Firestore Timestamp, debug front pour l'affichage des voyages (logs UID et voyages récupérés).
- Résolution du bug d'affichage des voyages : conversion Firestore Timestamp -> Date JS dans le mapping front, validation du flux complet parsing -> Firestore -> front, robustesse UID.
- Refonte de la page Mes Voyages : tri dynamique par date dans les onglets (en cours, à venir, passés) avec ion-segment, correction du bug ngModel/FormsModule, debug affichage, UX proche de TripIt.
- Règle métier : la date de début d'un voyage est toujours la date du premier plan, la date de fin celle du dernier plan. À chaque ajout ou update de plan, le voyage est ajusté si besoin. Règle immuable.

## [2024-06-XX] Correction traduction, reset login, switch FR/EN
- Correction critique : plus de page blanche, le pipe de traduction fonctionne partout (HttpClientModule injecté globalement via main.ts)
- Reset automatique des champs email/mot de passe à chaque affichage de la page de connexion (sécurité/UX)
- Correction du changement de langue dynamique (FR/EN) : la langue change instantanément sur toute l'interface
- Tests manuels validés : création de compte, email de vérification, connexion, affichage des voyages, logout, gestion utilisateur inexistant 

## [2024-06-XX] Test réussi de la réinitialisation de mot de passe
- Validation complète du flux de réinitialisation de mot de passe :
  - Le bouton "Mot de passe oublié ?" affiche le feedback utilisateur attendu
  - L'email de réinitialisation est bien reçu (délivrabilité confirmée)
  - Le lien dans l'email permet de changer le mot de passe avec succès
  - Redirection correcte vers la page de connexion après modification
- Tests manuels validés : envoi d'email, réception, modification du mot de passe, reconnexion 

## [2024-06-XX] Succès création de compte utilisateur
- Création d'un nouvel utilisateur : formulaire validé, compte créé dans Firebase Auth
- Email de vérification envoyé et reçu (testé sur Yahoo)
- Validation de l'email via le lien reçu : succès
- Accès à l'application après vérification
- Feedback utilisateur clair à chaque étape
- Problème initial résolu : la base Firestore n'était pas créée, correction apportée 

## [2024-06-XX] Diagnostic et robustesse parsing universel
- Ajout de logs détaillés à chaque étape du parsing (IMAP, buffer, décodage, OpenAI, Firestore)
- Décodage quoted-printable pour améliorer la compréhension du mail par l'IA
- Correction de la gestion asynchrone du flux IMAP pour garantir le traitement complet
- Contrôle explicite de la clé OPENAI_API_KEY et log d'erreur si absente/incorrecte
- Log de la réponse brute d'OpenAI et des erreurs de parsing JSON
- Prêt pour validation sur mails réels (EasyJet, location, etc.) 

## [2025-05-17] Déblocage de la synchro parsing universel → Firestore
- Ajout de logs détaillés sur l'écriture Firestore dans bobparser-ai.js.
- Ajout d'un plan de test automatique si aucun plan n'est extrait.
- Création et exécution d'un script de test Firestore (test-firestore.js) pour valider la connexion et les droits.
- Correction de la gestion asynchrone dans le script principal (attente explicite de toutes les écritures Firestore).
- Validation : la collection plans est bien créée, le plan de test apparaît dans Firestore. 

## [2024-06-XX] Améliorations UI/UX et Performance - Page Mes Voyages
- Refonte complète de l'affichage des détails des plans :
  - Icônes spécifiques pour chaque type de plan (vol, train, hôtel, etc.)
  - Labels traduits en FR/EN pour tous les champs
  - Affichage structuré des détails complexes (départ/arrivée, location voiture, etc.)
  - Boutons explicites "Voir le détail"/"Masquer le détail"
- Optimisations de performance :
  - Pré-calcul des détails des plans pour éviter les calculs dans le template
  - Correction des boucles infinies causées par les appels de méthodes dans le template
  - Gestion robuste des dates (Firestore Timestamp, Date, string)
- Améliorations techniques :
  - Correction des erreurs TypeScript pour l'accès aux propriétés dynamiques
  - Code plus robuste et maintenable
  - Meilleure gestion des cas d'erreur et des données manquantes
- Tests validés :
  - Affichage correct des plans dans les trois catégories (en cours, à venir, passés)
  - Performance fluide même avec beaucoup de plans
  - Traduction dynamique FR/EN
  - Gestion des cas limites (données manquantes, dates invalides) 

## [2024-06-XX] Enrichissement des données de voyage
- Intégration FlightRadar24 :
  - Récupération du statut en temps réel des vols
  - Informations sur les retards et annulations
  - Mise à jour automatique des terminaux et portes
  - Affichage du suivi de vol sur la carte
- Enrichissement IA :
  - Complétion des détails manquants (compagnie, type d'avion)
  - Calcul de la durée estimée du vol
  - Suggestions de plans connexes (transfert, hôtel)
  - Détection des correspondances
- Optimisations :
  - Mise en cache des données FR24 pour éviter les appels excessifs
  - Mise à jour asynchrone des statuts de vol
  - Gestion des timeouts et erreurs API
- Tests validés :
  - Récupération des données FR24 en temps réel
  - Enrichissement IA des plans incomplets
  - Performance et fiabilité des APIs
  - Gestion des cas d'erreur 

## [2024-06-XX] Sécurisation et proxy backend pour APIs externes
- Tous les appels à des APIs externes (FlightRadar24, OpenAI, etc.) passent désormais par un proxy backend sécurisé (Node.js/Express).
- Plus aucune clé API n'est exposée côté frontend.
- Suppression totale des erreurs CORS.
- Mise en cache des réponses FR24 (5 min) pour rapidité et robustesse.
- Gestion centralisée des erreurs et des logs.
- UX fluide : enrichissement des plans sans blocage, fallback élégant si API indisponible.
- Architecture évolutive : ajout facile d'autres APIs externes via le proxy. 

## [2024-06-XX] Corrections UX/UI et robustesse header global
- Suppression de tous les doubles bandeaux (barres utilisateur) sur les pages internes : un seul header global désormais.
- Affichage automatique du prénom et du nom de l'utilisateur connecté à droite du header, à côté de l'icône de profil, sur toutes les pages.
- Suppression du bouton menu (hamburger) inutile à côté du nom/prénom dans la barre utilisateur.
- Le header global gère désormais l'accès au menu, au profil, à la déconnexion et à l'affichage du nom/prénom de façon cohérente et professionnelle sur toute l'application.
- Tests manuels validés sur toutes les pages (landing, chat, bobbers, etc.) : plus de redondance, UX fluide, affichage correct du nom/prénom. 

## [2024-06-XX] Script de backup baseline automatisé
- Création du script `backup_baseline.sh` à la racine du projet.
- Ce script permet de :
  1. Réinitialiser le dépôt git local, faire un commit baseline et forcer le push sur GitLab (écrase tout l'historique).
  2. Créer une archive zip de la baseline (hors node_modules, dist, .git, etc.).
- Usage : `./backup_baseline.sh` (sous Linux/Mac ou WSL). Le script demande confirmation avant d'agir.
- Permet de revenir à tout moment à une baseline propre et traçable. 

- Correction des erreurs de toolbar dans les composants
- Implémentation de l'affichage du nom et prénom de l'utilisateur à côté de l'icône de profil dans la barre de statut
- Résolution des problèmes d'affichage du nom d'utilisateur dans la barre de statut 

- Ajout d'un script Node.js pour recréer le compte démo Firebase Auth avec l'UID d'origine, afin de garantir la cohérence avec les données Firestore et éviter les problèmes de connexion en mode démo.
- Documentation ajoutée dans le README pour expliquer l'utilisation du script et sa finalité. 

- Migration du compte démo Firebase Auth avec un nouvel UID (fUBBVpboDeaUjD6w2nz0xKni9mG3) suite à la recréation du compte.
- Mise à jour des scripts seed-demo-trips.ts et seed-demo-trips.js pour utiliser le nouvel UID.
- Régénération automatique des voyages et plans de démo liés à ce nouvel utilisateur.
- Documentation et process validés pour garantir la cohérence des données de démo après changement d'UID. 

- Ajout d'un fichier de suivi dédié aux UAT (User Acceptance Tests) avec démarche, exemples et conseils d'automatisation.
- Documentation du projet mise à jour pour inclure la gestion des UAT. 

### [2024-05-23] Timeline serpentin premium (page de test)
- Création d'une page de test Angular/Ionic pour afficher une timeline de voyage en serpentin vertical, inspirée de TripIt/Sunshine Adventures.
- SVG sinueux vertical, responsive, mobile-first.
- Placement dynamique des étapes (autant de plans que voulu), alternance gauche/droite.
- Icônes posées sur la route, texte à côté, effet flat/design magazine.
- Badges colorés, typographie premium, responsive.
- Plusieurs itérations pour coller au plus près de l'image d'inspiration.
- Limites : superposition possible sur petits écrans, complexité du SVG, effet "waw" graphique difficile à obtenir parfaitement en HTML/CSS pur.
- Travail stoppé à la demande de l'utilisateur pour prioriser d'autres tâches. 

# Fait

- Correction de l'affichage du spinner lors du chargement des étapes (plans)
- Suppression du message 'Aucune étape' pendant le chargement
- Optimisation du chargement des plans (suppression du délai artificiel)
- Traduction dynamique et automatique des types de plans (badges bleus) en fonction de la langue utilisateur
- Ajout automatique des clés de traduction pour tous les types de plans dans fr.json et en.json
- Vérification et correction de l'import du TranslatePipe
- UX premium sur la page Mes Voyages 