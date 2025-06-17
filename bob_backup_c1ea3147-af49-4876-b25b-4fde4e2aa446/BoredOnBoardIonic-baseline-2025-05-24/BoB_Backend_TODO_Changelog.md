# BoB Backend — TODO & Changelog (Référence pour Ionic)

## ✅ Fonctionnalités réalisées / changelog

- **Enrichissement FlightRadar24**
    - Correction de l'intégration : utilisation de la fonction fetchFlight du module flightradar24-client (au lieu d'une classe ou méthode inexistante)
    - Ajout de logs détaillés sur les appels, résultats et erreurs de l'API FR24
    - Nettoyage et normalisation du numéro de vol avant appel
    - Gestion du cache pour éviter les appels redondants
    - Testé sur des emails EasyJet réels : enrichissement effectif pour certains vols, gestion d'erreur pour les autres
- **Refonte du stockage des voyages (TripIt++)**
    - Stockage exhaustif de tous les champs pertinents pour chaque voyage, segment, location, hôtel, paiement, passager, etc.
    - Déduplication et mise à jour automatique par record_locator et ownerId
    - Ajout systématique du texte brut pour chaque bloc (raw_email, raw_segment, raw_car, raw_hotel, raw_payment, raw_passenger)
    - Backend prêt pour évolutions et enrichissements futurs (ajout d'autres types de plans, gestion fine des fusions, etc.)

## Fonctionnalités à développer / améliorer

- [ ] **Notification utilisateur par email**
    - Envoyer un email (FR + EN) à l'utilisateur quand un plan est ajouté avec succès (lien vers l'app BoB)
    - Envoyer un email (FR + EN) si l'ajout échoue (parsing impossible, etc.), pour inviter à saisir manuellement
- [ ] **Enrichissement FlightRadar24**
    - TODO : améliorer la gestion des erreurs HTTP et la robustesse sur les formats de numéro de vol
- [ ] **Parsing avancé**
    - Extraire plus d'infos : repas, divertissements, catégorie de tarif, etc. si possible
    - Ajouter d'autres compagnies ou formats d'email
- [ ] **Robustesse & UX**
    - Mieux gérer les erreurs de parsing et les logs
    - Ajouter des tests unitaires sur les parsers
- [ ] **Documentation**
    - Documenter l'API d'enrichissement et les nouveaux champs
    - Ajouter des exemples d'emails parsés

## Points à valider / idées pour la suite
- [ ] Ajouter une interface d'administration pour visualiser les logs et les voyages
- [ ] Permettre à l'utilisateur de compléter manuellement les champs manquants depuis l'app
- [ ] Support d'autres types de plans (hôtel, train, etc.) 