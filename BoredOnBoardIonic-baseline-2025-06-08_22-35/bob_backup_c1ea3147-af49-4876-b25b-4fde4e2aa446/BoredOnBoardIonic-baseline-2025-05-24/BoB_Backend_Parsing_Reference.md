# BoB Backend — Référence Parsing & Inspirations pour Ionic

## Synthèse des fonctionnalités du backend Node.js (projet avorté)

### Parsing & Enrichissement
- Parsing multi-stratégie des emails de réservation (EasyJet, TripIt, fallback classique, IA OpenAI)
- Extraction avancée des segments de vol (numéro, villes, horaires, sièges, bagages, terminaux, etc.)
- Structure de données `air_segments` très détaillée (voir plus bas)
- Enrichissement automatique via FlightRadar24 (type avion, codes IATA, fuseaux horaires, ponctualité, distance)
- Extraction location de voiture, paiements, passagers, liens de gestion

### Stockage & Intégration
- Recherche de l'utilisateur par email
- Création automatique de documents `trips` dans Firestore (Firebase)
- Prévu pour extension à d'autres compagnies ou types de parsing

### Logs & Robustesse
- Logging détaillé pour debug (fichier logs/imap.log)
- Gestion fine des erreurs (par email, par enrichissement FR24)
- Mode batch privilégié pour CI/CD (traitement ponctuel, arrêt explicite du process)

### Dépendances principales
- firebase-admin (Firestore)
- imap-simple, mailparser (lecture emails)
- flightradar24-client (enrichissement vols)
- openai (fallback IA)

---

## Structure de données `air_segments` (pour inspiration côté Ionic/Firestore)
- airline
- flight_number
- confirmation_number
- departure_airport_code
- departure_airport_name
- departure_city
- departure_time
- departure_timezone
- terminal_departure
- gate_departure
- arrival_airport_code
- arrival_airport_name
- arrival_city
- arrival_time
- arrival_timezone
- terminal_arrival
- gate_arrival
- seat
- class_of_service
- aircraft
- fare_category
- meal
- entertainment
- stopovers
- distance
- on_time_percentage
- baggage
- status

---

## Points d'attention pour la version Ionic
- Le parsing email et l'enrichissement FlightRadar24 étaient côté backend Node.js, mais la structure de données et la logique d'enrichissement sont à conserver côté Firestore/Ionic.
- Prévoir une API ou un microservice pour le parsing si besoin (hors scope mobile, mais à anticiper pour l'intégration).
- Les logs détaillés et la gestion d'erreur fine sont essentiels pour la robustesse (à prévoir côté mobile pour la synchro et l'import).
- L'intégration avec Firestore doit permettre la création et la mise à jour des voyages enrichis.
- Les notifications email utilisateur étaient prévues mais non développées (à garder en backlog).

---

## Historique CI/CD & Batch (pour inspiration devops)
- Mode batch recommandé pour les traitements ponctuels (éviter les jobs qui tournent en boucle en CI/CD)
- Arrêt explicite du process après traitement (exit 0 ou 1)
- Logs détaillés pour chaque étape du parsing et de l'enrichissement

---

## À retenir pour la version Ionic
- S'inspirer de la structure `air_segments` pour la modélisation des voyages dans Firestore
- Prévoir une architecture modulaire pour intégrer facilement parsing, enrichissement, et synchronisation
- Anticiper l'intégration future d'un backend parsing (API REST ou microservice)
- Garder la robustesse et la traçabilité comme priorités (logs, gestion d'erreur, reporting) 