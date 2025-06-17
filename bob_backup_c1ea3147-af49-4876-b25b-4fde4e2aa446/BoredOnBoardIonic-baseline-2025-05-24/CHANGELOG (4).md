# CHANGELOG

## [Non daté] Fonctionnalités majeures réalisées

### Enrichissement FlightRadar24
- Correction de l'intégration : utilisation de la fonction fetchFlight du module flightradar24-client (au lieu d'une classe ou méthode inexistante)
- Ajout de logs détaillés sur les appels, résultats et erreurs de l'API FR24
- Nettoyage et normalisation du numéro de vol avant appel
- Gestion du cache pour éviter les appels redondants
- Testé sur des emails EasyJet réels : enrichissement effectif pour certains vols, gestion d'erreur pour les autres

### Refonte du stockage des voyages (TripIt++)
- Stockage exhaustif de tous les champs pertinents pour chaque voyage, segment, location, hôtel, paiement, passager, etc.
- Déduplication et mise à jour automatique par record_locator et ownerId
- Ajout systématique du texte brut pour chaque bloc (raw_email, raw_segment, raw_car, raw_hotel, raw_payment, raw_passenger)
- Backend prêt pour évolutions et enrichissements futurs (ajout d'autres types de plans, gestion fine des fusions, etc.) 