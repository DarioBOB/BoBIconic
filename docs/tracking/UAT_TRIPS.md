# UAT – User Acceptance Tests (Tests d'acceptation utilisateur)

## Objectif
Valider que la gestion des voyages (Trips) et la fenêtre de vol répondent aux exigences fonctionnelles, de robustesse, de sécurité, d'UX et d'internationalisation.

---

## 1. Accès et affichage des voyages
- [ ] L'utilisateur voit ses voyages triés (en cours, à venir, passés).
- [ ] Les voyages s'affichent même en mode hors-ligne (cache).
- [ ] Les messages "Aucun voyage trouvé" s'affichent pour chaque catégorie vide.
- [ ] Les détails d'un voyage et ses plans sont accessibles.

## 2. Sécurité et rôles
- [ ] Un utilisateur standard ne voit que ses voyages.
- [ ] Un administrateur voit tous les voyages.
- [ ] Un utilisateur démo voit un jeu de données de démonstration.
- [ ] Les accès non autorisés sont bloqués et notifiés.

## 3. Authentification et administration
- [x] Un utilisateur admin (bobplans@sunshine-adventures.net) est automatiquement redirigé vers la page d'administration après connexion.
- [x] La page d'administration est protégée par un guard (adminOnlyGuard).
- [x] Un utilisateur non-admin ne peut pas accéder à la page d'administration.
- [x] Le bouton de déconnexion fonctionne et redirige vers la page de connexion.

## 4. Robustesse et gestion des erreurs
- [ ] Les erreurs de chargement (voyages/plans) affichent un toast/message explicite.
- [ ] Les erreurs de validation de données sont notifiées.
- [ ] Le fallback cache fonctionne si Firestore est indisponible.
- [ ] Les logs d'erreur sont présents en console pour le debug.
- [ ] Les erreurs (FR24, météo, photo) affichent un message traduit.
- [ ] Les données météo d'arrivée sont affichées de façon lisible et moderne.

## 5. Expérience utilisateur (UX)
- [ ] Les toasts/messages sont clairs, traduits, et adaptés à la langue de l'utilisateur.
- [ ] L'interface reste fluide même en cas de lenteur réseau ou d'erreur.
- [ ] Les boutons, menus et tuiles sont accessibles et fonctionnels.

## 6. Internationalisation
- [ ] Tous les messages (erreurs, "aucun voyage", etc.) sont traduits en français et anglais.
- [ ] Le changement de langue dans l'application met à jour tous les textes dynamiquement.

## 7. Fenêtre de vol (Window)
- [ ] La recherche d'un vol affiche les données attendues (ou un message "Aucun vol trouvé").
- [ ] Les erreurs (FR24, météo, photo) affichent un message traduit.
- [ ] Les données météo d'arrivée sont affichées de façon lisible et moderne.

## 8. Scénarios offline/online
- [ ] Les voyages/plans sont accessibles sans connexion (cache).
- [ ] La synchronisation se fait automatiquement au retour du réseau.
- [x] La structure de données (collection `plans` au niveau racine) fonctionne comme prévu

## 9. Documentation et suivi
- [ ] La documentation utilisateur et développeur est accessible et à jour.
- [ ] Le suivi des tâches et des changements est complet.

## 10. Proxy FR24 et compatibilité mobile/desktop
- [x] L'application utilise une variable d'environnement (fr24ApiBaseUrl) pour accéder au backend FR24.
- [x] Les requêtes fonctionnent sur desktop (localhost) et sur mobile (IP locale du PC).
- [x] La configuration est documentée et ne nécessite pas de modification du code pour changer d'environnement.

## 11. Menu latéral : navigation et expérience utilisateur
- [x] Menu latéral : navigation et expérience utilisateur — **Validé avec succès**
  - Navigation, traductions, logout OK pour les utilisateurs classiques.
  - Menu latéral caché pour l'admin (UX professionnelle, pas de confusion possible).
- [x] Accès et affichage de la page admin (admin guard, UX dédiée) — **Validé avec succès**
  - Accès strictement réservé à l'admin (guard).
  - Menu latéral utilisateur caché pour l'admin, UX claire et séparée.
  - Redirections et protections robustes, déconnexion OK.

## 12. Accès aux plans et sécurité (2025-06-19)
- [x] Les plans sont accessibles pour l'utilisateur d_mangano@yahoo.com
- [x] Les règles de sécurité Firestore sont correctement configurées pour la collection `plans`
- [x] L'accès aux plans est limité aux voyages de l'utilisateur
- [x] La structure de données (collection `plans` au niveau racine) fonctionne comme prévu

## 13. UAT (2025-06-20) - Authentification et 2 premières tuiles
- [x] **Authentification** : Connexion/déconnexion, gestion des rôles (standard, démo, admin) et erreurs validées.
- [x] **Through-My-Window** : Recherche de vol, affichage des données, carte et mode offline validés.
- [x] **Flight Search** : Recherche par numéro de vol, historique et filtres validés.
- [x] **Intégration Cache** : Persistance, performance et nettoyage automatique validés.

---

**Remarques** :
- Cochez chaque test après vérification.
- Notez tout bug, incohérence ou suggestion dans le fichier TODO ou via le suivi de projet.

**Responsable UAT** : ____________________
**Date de validation** : ____________________

- Correction de la clé de traduction `HOME.BASELINE` (affichage page login) : ajout direct dans les fichiers de traduction.
- Debug UX barre utilisateur : diagnostic par test de composant minimaliste, suppression du slot end Ionic, placement sous le header avec style responsive.
- Correction réseau Flask : modification du lancement avec `host='0.0.0.0'` pour rendre le backend accessible sur l'IP de la machine (résout les erreurs de connexion depuis l'app Ionic sur mobile/PC). 