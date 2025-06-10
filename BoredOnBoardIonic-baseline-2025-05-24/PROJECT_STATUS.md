# Systèmes d'enrichissement API pour BoB

## 1. Enrichissement des vols
- **FlightAware** (implémenté) : Statut temps réel, position, historique, aéroports, compagnies.
- **AviationStack** (implémenté) : Statut, compagnies, aéroports, plan gratuit.
- **AirLabs** (à faire) : Historique, compagnies, plan gratuit généreux.
- **OpenSky** (à faire) : Temps réel, open source, gratuit.

## 2. Points d'intérêt (POIs)
- **OpenStreetMap** (à faire) : POIs touristiques, export offline, gratuit.
- **Google Places API** (à faire) : POIs riches, photos, avis, descriptions.
- **Wikipedia** (partiel) : Infos historiques/culturelles, gratuit.

## 3. Calcul de position et suivi de vol
- **Great Circle Mapper** (à faire) : Calcul trajectoire, distance, temps estimé.
- **OpenSky Network** (à faire) : Position live, open source.
- **FlightAware** (implémenté) : Estimation automatique.

## 4. Gestion des données hors ligne
- **Export OSM/POIs** (à faire) : Données offline, personnalisable.
- **Cache local Firestore** (partiel) : Synchro automatique, limité par quota.

## Scripts à prévoir
- `src/scripts/airlabs-enrichment.js` : Enrichissement vols AirLabs
- `src/scripts/poi-fetcher.js` : Récupération/export POIs
- `src/scripts/flight-tracker.js` : Calcul trajectoire/position
- `src/scripts/offline-data-manager.js` : Gestion offline/synchro

## Prochaines étapes
- Implémenter les scripts manquants
- Documenter chaque source de données et clé API
- Prévoir fallback et gestion des quotas
- Exporter POIs et vols en local pour offline

## Mode démo local multilingue implémenté :
- Jeu de données complet en FR/EN (assets/demo/demo-data.json)
- Popup de choix de langue à l'entrée du mode démo
- Tous les services (Trip, Notification, User, etc.) utilisent les données locales si le mode démo est actif
- Navigation et expérience utilisateur identiques au mode connecté

# PROJECT STATUS

## Fonctionnement actuel

### 1. Génération des données de démo
- Le script `seed-demo-trips.ts` (compilé en JS puis exécuté) **ne crée que le user de démo (`guestuser@demo.com`) et ses voyages/plans**.
- Il **ne touche pas aux autres utilisateurs** ni à leurs voyages/plans.
- Les voyages de démo sont :
  - Voyage passé à Barcelone
  - Voyage en cours à Rome
  - Voyage futur à Montréal

### 2. Suppression totale (reset Firestore)
- Le script temporaire `wipe-firestore.js` **supprime tous les users, voyages et plans** dans Firestore (hors authentification Firebase).
- À utiliser uniquement en cas de besoin extrême, car il efface tout.

### 3. Parsing d'emails
- Le parsing d'emails est désormais assuré par un seul script officiel : backend/scripts/bobparser.cjs
- Ce script lit les e-mails non lus, envoie le contenu à OpenAI (prompt enrichi), et stocke les plans/voyages extraits dans Firestore (structure validée, logs détaillés)
- Les emails du user de démo sont ignorés.
- Tous les anciens scripts de parsing ont été supprimés pour éviter toute confusion.

### 4. Scripts non conformes
- Les anciens scripts JS qui créaient des données réelles ont été supprimés pour éviter toute confusion.

### 5. Procédure recommandée
1. **Pour repartir d'une base propre** :
   - Lancer `node src/scripts/wipe-firestore.js` (efface tout dans Firestore)
2. **Pour générer la démo** :
   - Compiler puis lancer `seed-demo-trips.ts` (ou utiliser le JS généré)
   - Ex :
     ```bash
     npx tsc --target es2015 --module commonjs src/scripts/seed-demo-trips.ts --outDir src/scripts/
     node src/scripts/seed-demo-trips.js
     ```
3. **Pour recréer les données réelles** :
   - Lancer le parsing d'emails (les users/voyages/plans réels seront recréés automatiquement)

---

**Le projet est désormais conforme au cahier des charges : la démo et les données réelles sont totalement séparées et maîtrisées.**

# Statut du projet BoB (BoredOnBoard)

## Mode Démo (seed automatique)
- Un script de seed supprime chaque jour toutes les anciennes données de démo (voyages, plans, notifications, etc.) pour l'utilisateur guestuser@demo.com.
- Il crée 3 voyages de démo (passé, en cours, futur), chacun avec au moins 3 plans de types différents (vol, hôtel, location/activité/transfert), avec des dates dynamiques pour garantir qu'il y a toujours un voyage en cours, un à venir, un passé.
- Les titres, prénoms, noms, etc. sont multilingues (fr/en) et affichés selon la langue choisie dans l'app.
- **Aucun e-mail ne doit jamais être envoyé à guestuser@demo.com** (règle absolue, à vérifier dans tous les scripts/services).
- Les e-mails envoyés par guestuser@demo.com sont ignorés par le parser.
- Les données de démo sont visibles dans l'UI comme pour un vrai utilisateur.

## Traitement des e-mails (parser)
- Le script de parsing lit les e-mails non lus sur bobplans@sunshine-adventures.net.
- Si l'expéditeur existe dans BoB (hors guestuser@demo.com) :
  - Création/mise à jour du voyage et des plans.
  - Envoi d'un e-mail de confirmation.
- Si l'expéditeur n'existe pas :
  - Envoi d'un e-mail d'information, aucune création de données.
- **Aucun traitement ni e-mail pour guestuser@demo.com**.

## Structure de la base Firestore (après seed)
- 2 users :
  - guestuser@demo.com (données de démo, multilingue)
  - d_mangano@yahoo.com (user réel, voyage à Bruxelles + plans)
- 3 voyages de démo (passé, en cours, futur) pour guestuser@demo.com, chacun avec 3 plans.
- 1 voyage réel à Bruxelles pour d_mangano@yahoo.com, avec 3 plans.

## À faire
- Automatiser le lancement du script de seed (cron ou cloud function).
- Continuer à garantir la séparation stricte entre données de démo et données réelles.
- Vérifier régulièrement que la règle "aucun e-mail pour le user de démo" est respectée partout.

# État du projet BoB (Board On Board)

## Architecture générale
- **Backend Node.js** (scripts dans backend/scripts, Firestore, OpenAI, IMAP, SMTP)
- **Frontend Angular/Ionic** (src/app/pages, src/app/features)
- **Base de données Firestore** (collections : users, trips, plans)
- **Authentification Firebase Auth**

## Workflows principaux
- **Parsing d'email** :
  - Lecture des emails non lus via IMAP (Zoho)
  - Extraction structurée et enrichissement via OpenAI (prompt optimisé pour JSON Firestore)
  - Vérification de l'utilisateur dans Firebase Auth
  - Création/mise à jour du user dans Firestore (idempotent)
  - Création/mise à jour du voyage (trip) et des plans (plans/segments) dans Firestore (idempotent, pas de doublons)
  - Envoi d'email de notification selon le cas métier
  - Marquage de l'email comme lu

- **Affichage frontend** :
  - Affichage des voyages et plans pour l'utilisateur connecté (ou user démo)
  - Séparation ongoing/upcoming/past
  - Affichage détaillé des plans (vols, voitures, etc.)

## Choix techniques
- **OpenAI** pour le parsing et l'enrichissement (prompt strict JSON, format ISO pour les dates)
- **Firestore** :
  - users : doc par UID Firebase
  - trips : doc par hash(userId+reservationNumber)
  - plans : doc par hash(tripId+type+numéro/date)
- **Idempotence** : update intelligent, jamais de doublons
- **Gestion des erreurs** : logs, emails, UI

## Points forts
- Parsing automatique et enrichi
- Robustesse Firestore (pas de doublons, update auto)
- Front moderne et modulaire
- Facile à étendre (nouvelles sources, nouveaux plans)

## Points à améliorer
- Suppression (soft delete) des voyages/plans
- Gestion avancée des droits et préférences
- Tests automatisés backend et frontend
- Mode démo sans login
- Documentation API et modèles

## Prochaines étapes
- Voir Afaire.md pour la roadmap détaillée 