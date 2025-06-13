# Cahier des charges approfondi et étendu — Développement de l'application BoB (Bored On Board)

## 🎯 Objectif stratégique
Ce document vise à établir, selon une perspective exhaustive et rigoureusement structurée, les fondements conceptuels, fonctionnels, technologiques et expérientiels du système applicatif BoB (Bored On Board). L'application s'inscrit au croisement de plusieurs domaines de recherche : systèmes d'information mobiles adaptatifs, expériences utilisateur contextuelles, infrastructure de données distribuée et design de services. BoB ambitionne de se positionner comme une plateforme complète et proactive pour les voyageurs aériens, en mobilisant les technologies de parsing intelligent, de cartographie interactive, de recommandation prédictive, d'engagement communautaire embarqué, et de gamification de l'expérience en transit. L'enjeu est de construire une infrastructure logicielle résiliente, modulaire, interopérable et centrée sur l'humain, permettant d'augmenter l'expérience du voyageur tout au long de son cycle de mobilité.

---

## 🧩 Décomposition fonctionnelle détaillée

### 1. Authentification et identité numérique
- Mise en œuvre d'un système d'authentification distribué basé sur Firebase Authentication avec support natif des fournisseurs OAuth2 (Google, Facebook, LinkedIn).
- Gestion des sessions multi-appareils et synchronisation sécurisée des états de connexion utilisateur via token refresh et invalidation à distance.
- Architecture orientée modèle de données : chaque utilisateur est associé à une entité "AppUser" stockée dans Firestore, comprenant des métadonnées personnelles, un journal d'événements (logs d'usage), des préférences UX/UI et un graphe social.

### 2. Importation sémantique des réservations et normalisation des données
- Chaque utilisateur dispose d'une adresse email unique attribuée à l'activation du compte (alias sécurisé redirigé vers un moteur de parsing).
- Le moteur utilise des techniques de traitement du langage naturel (NLP) et d'extraction d'entités nommées (NER) pour structurer les données issues des emails de confirmation (vols, hôtels, événements, activités).
- Compatibilité avec les principaux fournisseurs (Gmail, Outlook, Yahoo) via APIs OAuth 2.0 (Gmail API, Microsoft Graph).
- Détection automatique de doublons, fusion intelligente des itinéraires, et catégorisation des plans par type d'entité.

### 3. Modélisation multi-itinéraires et architecture événementielle
- Chaque voyage est modélisé comme un objet composite de segments temporels typés : transport, hébergement, activité, note, segment libre.
- Fonctionnalités CRUD avancées : ajout, duplication, partage collaboratif, versionnage et commentaires.
- Prise en charge de plusieurs formats d'import : .ics, .pdf, emails, interconnexion API avec agences de voyage.
- Système de gestion des documents : ajout de pièces jointes (boarding pass, vouchers, visas, QR codes) avec prévisualisation inline.

### 4. Résilience offline et stratégie de synchronisation
- Architecture hybride : données persistées en local avec IndexedDB et cache intelligent, synchronisation optimiste ou différée selon connectivité.
- Détection des conflits de mise à jour (merge automatique ou choix manuel), avec log d'événements système.
- Mode dégradé pour les opérations critiques (consultation d'itinéraire, affichage des documents essentiels, jeux embarqués).

### 5. Timeline interactive sémantique
- Interface utilisateur basée sur une chronologie verticale segmentée par jour, typologie d'événement et priorité temporelle.
- Affichage personnalisable : regroupement par thème, type d'activité, durée, ou localité.
- Comportements dynamiques : collapsible days, drag & drop, édition inline, état de validation visuel (icônes, couleurs, statuts).
- Accessibilité renforcée : navigation clavier, lecteurs d'écran, contrastes élevés, personnalisation des tailles de texte.

### 6. Visualisation cartographique et POI contextuels
- Intégration d'une carte interactive basée sur Mapbox GL JS ou Leaflet, avec affichage dynamique des lieux d'intérêt visibles depuis la position de l'avion.
- Modèle géospatial simulé (lorsque le GPS est inopérant) basé sur les horaires, la vitesse estimée et les coordonnées interpolées.
- Couche de superposition des POIs enrichis via APIs Wikipedia, GeoNames, OpenStreetMap : noms, descriptions, images, liens externes.
- Interface interactive : fiches contextuelles, ajout de lieux aux favoris, vue 3D du relief (option).

### 7. Réseau social embarqué — Interactions et entraide
- Détection des utilisateurs présents dans un même vol ou voyage via matching des IDs d'itinéraire ou géolocalisation coopérative (vol, aéroport).
- Mécanismes d'interaction : chat privé, discussion de groupe, suggestions de connexion (co-trajet, intérêts communs).
- Gestion communautaire : modération, blocage, signalement, paramètres de confidentialité granulaire.
- Recommandations : alertes quand un contact est détecté à proximité ou partage un plan commun.

### 8. Gamification et divertissement cognitif
- Catalogue de jeux adaptatifs liés aux destinations, à la culture locale ou à la thématique du voyage (quiz, devinettes, jeux d'association).
- Infrastructure de matchmaking embarquée (matchs au sein d'un vol ou d'un terminal).
- Récompenses virtuelles, badges, tableaux de classement temporaires et historiques personnels.
- Mode offline natif pour assurer la disponibilité constante du divertissement.

### 9. Services contextuels à l'arrivée
- Génération automatique d'une fiche "Arrivée" par destination, incluant : plan du terminal, temps estimé de passage à la douane, récupération des bagages.
- Accès rapide à la réservation d'un moyen de transport (deep linking vers Uber, Bolt, etc. ou formulaire BoB).
- Suggestions de lieux à visiter dans les 24h suivant l'arrivée (personnalisées).
- Notifications adaptatives : rappel d'avis à donner, partage de photos, ajout de notes ou contacts.

### 10. Évaluation structurée de l'expérience utilisateur
- Système de feedback post-événement multi-critère (notation, slider, commentaire textuel).
- Agrégation automatique de la satisfaction par itinéraire ou compagnie aérienne.
- Export anonymisé des feedbacks pour analyse statistique et BI.
- Option de partage public ou privé des évaluations (avec métadonnées temporelles).

### 11. Mécanisme de notifications et déclencheurs intelligents
- Notifications déclenchées par événement, géolocalisation, prédiction horaire ou activité sociale.
- Options de configuration avancées : fréquence, canal, fenêtre de tolérance, fuseau horaire de référence.
- Agenda personnel intégré synchronisé avec les itinéraires BoB et les calendriers système (Google, Apple).

---

## 🔐 Sécurité, confidentialité et gouvernance des données
- Chiffrement de bout en bout (E2EE) sur toutes les communications sensibles.
- Application de politiques de confidentialité conformes au RGPD, CCPA, ISO 27701.
- Système de rôles (RBAC) et contrôle d'accès basé sur les attributs (ABAC).
- Journalisation complète, possibilité de demande de rapport d'activité, réversibilité des données et suppression automatisée des historiques après N mois.

---

## 🎨 Expérience utilisateur et interfaces adaptatives
- Design modulaire basé sur une architecture orientée composants : pages principales, sous-modules, overlays.
- Personnalisation poussée : thèmes, police, contrastes, animations réduites.
- Adaptabilité UI : responsive, mobile-first, accessibilité renforcée WCAG 2.1 AA.
- Système de feedback en ligne sur les écrans, avec collecte des usages réels pour affinement UX.

---

## 🔗 Écosystème d'intégration interopérable
- APIs de référence : FlightRadar24, OpenSky, Wikipedia, GeoNames, OpenFlights, IATA.
- Parsing e-mail automatisé : Mailgun, Mailjet, avec extraction NLP + règles métier.
- Backend cloud : Firebase (auth, firestore, messaging, storage, analytics), Stripe (paiement), Algolia (recherche), Sentry (monitoring).
- Connecteurs tiers : iCalendar, Google Calendar, Apple Wallet.

---

## 📊 Personnalisation avancée, impact environnemental et fidélisation
- Suivi automatisé de l'empreinte carbone (modèle externe ou API partenaire).
- Journal de voyage interactif exportable : CSV, PDF, ICS, JSON-LD.
- Comptage symbolique des trajets, pays, kilomètres, compagnies utilisées.
- Moteur de suggestion de plans futurs basé sur historique, profil et POI similaires.
- Intégration de programmes de fidélité compagnies / hôtels (scan carte, API).

---

## 💰 Modèle économique évolutif
- Version gratuite : fonctionnalités essentielles, présence de publicités non-intrusives
- Offre premium : abonnement mensuel ou annuel, accès à toutes les fonctionnalités, support prioritaire
- Monétisation indirecte : vente de services partenaires (guides, réservations, upgrades)
- Offre entreprise : comptes multi-utilisateurs, outils de reporting, synchronisation CRM

---

## ✅ Synthèse stratégique
| Axe structurant | Fonctionnalités associées |
|----------------|--------------------------|
| 🧠 Système contextuel intelligent | Cartes dynamiques, POIs pertinents, déclencheurs géolocalisés et temporalisés |
| 👥 Réseau social embarqué | Matchs de vol, chat de bord, suggestions de compagnons de route |
| 🎮 Divertissement augmenté | Jeux embarqués, apprentissage contextuel, valorisation de l'attente par gamification |
| 📊 Valorisation de données | Analyse de mobilité, export éthique, empreinte carbone, suggestions personnalisées |

---

Ce cahier des charges constitue un document fondamental pour la conception, l'architecture, le développement et l'itération de l'écosystème applicatif BoB. Il synthétise une vision systémique et centrée utilisateur de l'expérience de mobilité aérienne augmentée par la technologie. Il s'adresse autant à une équipe projet multidisciplinaire qu'à des partenaires académiques ou industriels engagés dans l'innovation du voyage numérique. 