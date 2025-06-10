# BoB Backend — Historique CI/CD & TODOs (Référence pour Ionic)

## Historique des essais et ajustements CI/CD

- [2024-05-09] Ajout du mode batch : le script traite les emails non lus puis s'arrête (suppression du keepalive/IDLE).
- [2024-05-09] Ajout de process.exit(0) après la fermeture IMAP pour forcer l'arrêt immédiat après traitement.
- [2024-05-09] Ajout de process.exit(1) dans le bloc catch pour forcer l'arrêt en cas d'erreur (évite les jobs GitLab qui tournent dans le vide).
- [2024-05-09] Tests du mode keepalive/IDLE : non retenu car inadapté à GitLab CI/CD (le job ne s'arrête jamais).
- [2024-05-09] Ajout de logs détaillés sur le parsing, l'enrichissement FR24, et l'extraction de la référence de réservation.

---

# TODO — BoB Backend (pour inspiration côté Ionic)

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
- [ ] **Revue des écrans front-end**
    - Améliorer l'affichage des voyages et segments dans l'app, pour une expérience utilisateur à la TripIt (clarté, détails, ergonomie, responsive, etc.)

## Points à valider / idées pour la suite
- [ ] Ajouter une interface d'administration pour visualiser les logs et les voyages
- [ ] Permettre à l'utilisateur de compléter manuellement les champs manquants depuis l'app
- [ ] Support d'autres types de plans (hôtel, train, etc.) 