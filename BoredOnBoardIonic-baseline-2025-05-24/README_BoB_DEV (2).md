# BoB Backend — Documentation Développeur

## Contexte
Ce backend Node.js gère le parsing automatique d'emails de réservation (EasyJet, TripIt, etc.) pour créer des plans de voyage dans l'application BoB. Il enregistre les voyages dans Firestore (Firebase) pour l'utilisateur concerné.

## Fonctionnalités développées

- **Parsing multi-stratégie des emails** :
  - Parsing spécifique EasyJet (français)
  - Parsing générique TripIt-like
  - Parsing classique (fallback)
  - Parsing IA (OpenAI) en dernier recours
- **Extraction avancée des segments de vol** :
  - Extraction du numéro de vol, villes, dates/heures, sièges, bagages, terminaux, classe, etc.
  - Structure `air_segments` enrichie pour coller à TripIt (voir plus bas)
- **Enregistrement automatique en base** :
  - Recherche de l'utilisateur par email
  - Création d'un document `trips` dans Firestore avec toutes les infos extraites
- **Enrichissement automatique via FlightRadar24** :
  - Utilisation du wrapper `flightradar24-client` pour compléter les champs manquants (type d'avion, codes IATA, fuseaux horaires)
  - Enrichissement déclenché uniquement si des champs sont vides
- **Gestion des logs** :
  - Logging détaillé dans `logs/imap.log` pour le suivi et le debug
- **Structure de données des segments de vol (`air_segments`)** :
  - Champs : `airline`, `flight_number`, `confirmation_number`, `departure_airport_code`, `departure_airport_name`, `departure_city`, `departure_time`, `departure_timezone`, `terminal_departure`, `gate_departure`, `arrival_airport_code`, `arrival_airport_name`, `arrival_city`, `arrival_time`, `arrival_timezone`, `terminal_arrival`, `gate_arrival`, `seat`, `class_of_service`, `aircraft`, `fare_category`, `meal`, `entertainment`, `stopovers`, `distance`, `on_time_percentage`, `baggage`, `status`
- **Extraction location de voiture, paiements, passagers, liens de gestion**
- **Robustesse Firestore** : le backend n'envoie plus de valeurs undefined, ce qui garantit la création fiable des plans et voyages dans Firestore après parsing email.

## Fichiers principaux
- `imap.js`

## Documentation détaillée du parsing
- Voir `docs/parsing/README_parsing.md` pour la documentation complète sur le parsing, la structure des données, les enrichissements, la robustesse, et le prompt IA utilisé.