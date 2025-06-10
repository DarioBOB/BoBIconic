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

## Fichiers principaux
- `imap.js` : toute la logique de parsing, enrichissement, et enregistrement
- `check_db.js` : script de vérification des enregistrements en base
- `logs/imap.log` : logs détaillés

## Dépendances principales
- `firebase-admin` (Firestore)
- `imap-simple`, `mailparser` (lecture emails)
- `flightradar24-client` (enrichissement vols)
- `openai` (fallback IA)

## À savoir pour la suite
- Un enrichissement automatique par FlightRadar24 est en place, mais peut être étendu (distance, ponctualité, etc.)
- Les notifications email utilisateur sont prévues mais non encore développées
- Le code est prêt à être étendu pour d'autres compagnies ou types de parsing 

---

## Historique des essais CI/CD et batch

- Plusieurs stratégies testées pour l'arrêt du script sur GitLab CI/CD :
    - Mode keepalive/IDLE (écoute continue) : non adapté, le job ne s'arrête jamais.
    - Mode batch (un seul passage sur les emails non lus) : adapté à la CI/CD.
    - Ajout de process.exit(0) après la fermeture IMAP pour garantir l'arrêt immédiat.
    - Ajout de process.exit(1) dans le bloc catch pour forcer l'arrêt en cas d'erreur (évite les jobs bloqués).
- Solution retenue : mode batch + arrêt explicite du process (exit 0 ou 1).
- Ajout de logs détaillés pour faciliter le debug et le suivi des traitements.

## Derniers changements (2024)

### Gestion des erreurs et arrêt du script
- Amélioration de la gestion des erreurs pour chaque email individuellement
- Ajout de compteurs pour suivre le nombre d'emails traités et d'erreurs
- Vérification de la validité du corps de l'email
- Logs plus détaillés sur la progression du traitement
- Arrêt explicite du script avec le bon code de sortie (0 pour succès, 1 pour erreur)
- Suppression des logs verbeux inutiles

### Améliorations FR24 et encodage
- Meilleure gestion des erreurs FR24
- Correction de l'encodage des logs en UTF-8
- Simplification des messages de log
- Meilleure gestion des cas d'erreur FR24
- Retour du segment original en cas d'erreur FR24 