# Plan de tests fonctionnels BoB

## 1. Landing Page (Accueil)
- **Action** : Arriver sur la page d'accueil sans être connecté
  - **Résultat attendu** : Affichage du logo, baseline traduite, boutons Se connecter / Créer un compte / Tester l'app, background dynamique, lien Sunshine Adventures visible
- **Action** : Changer la langue (FR/EN)
  - **Résultat attendu** : Tous les textes changent instantanément

## 2. Authentification (Connexion)
- **Action** : Saisir un email et un mot de passe valides, cliquer sur Se connecter
  - **Résultat attendu** : Redirection vers la Home, affichage des voyages
- **Action** : Saisir un mauvais mot de passe
  - **Résultat attendu** : Message d'erreur "Email ou mot de passe incorrect"
- **Action** : Saisir un email inexistant
  - **Résultat attendu** : Message d'erreur "Aucun compte associé à cet email"
- **Action** : Cliquer sur "Mot de passe oublié ?" sans email
  - **Résultat attendu** : Message d'erreur "Veuillez entrer votre email"
- **Action** : Cliquer sur "Mot de passe oublié ?" avec email valide
  - **Résultat attendu** : Redirection vers la page de confirmation, email envoyé

## 3. Création de compte
- **Action** : Cliquer sur "Créer un compte", remplir tous les champs avec des données valides, mots de passe conformes et identiques
  - **Résultat attendu** : Compte créé, email de vérification envoyé, attente de validation
- **Action** : Saisir deux mots de passe différents
  - **Résultat attendu** : Message d'erreur "Les mots de passe ne correspondent pas"
- **Action** : Saisir un mot de passe non conforme (règles)
  - **Résultat attendu** : Message d'erreur sur les règles de sécurité

## 4. Réinitialisation du mot de passe
- **Action** : Suivre le lien reçu par email, saisir deux fois un nouveau mot de passe conforme
  - **Résultat attendu** : Message de succès, redirection vers la connexion

## 5. Navigation et accessibilité transverses
- **Action** : Ouvrir le menu latéral sur chaque page (landing, voyages, chat, etc.)
  - **Résultat attendu** : Menu accessible, navigation possible vers toutes les sections
- **Action** : Cliquer sur le bouton profil dans la barre de statut sur chaque page
  - **Résultat attendu** : Accès à la page profil utilisateur
- **Action** : Cliquer sur le bouton logout sur chaque page
  - **Résultat attendu** : Déconnexion immédiate, redirection vers la page de connexion
- **Action** : Vérifier la cohérence graphique (palette, polices, responsive, accessibilité) sur chaque page
  - **Résultat attendu** : Respect strict de la charte graphique partout
- **Action** : Changer la langue sur chaque page
  - **Résultat attendu** : Traductions instantanées sur tous les textes

## 6. Pages principales (derrière chaque tuile)
- **Action** : Accéder à chaque page via la tuile correspondante (voyages, fenêtre, chat, etc.)
  - **Résultat attendu** : Affichage de la page, menu, profil et logout accessibles, contenu conforme au plan de développement
- **Action** : Tester les fonctionnalités spécifiques à chaque page (voir plan détaillé dans Afaire.md)
  - **Résultat attendu** : Fonctionnalités conformes au cahier des charges, navigation fluide, feedback utilisateur

## [2024-06-XX] Tests manuels - Barre utilisateur et header global
- Vérifier qu'un seul header (barre utilisateur) est visible sur toutes les pages (landing, chat, bobbers, profil, etc.).
- Vérifier que le prénom et le nom de l'utilisateur connecté s'affichent à droite du header, à côté de l'icône de profil.
- Vérifier que le bouton menu (hamburger) n'apparaît plus à côté du nom/prénom dans la barre utilisateur.
- Vérifier que le bouton déconnexion fonctionne sur toutes les pages.
- Vérifier la cohérence graphique et l'absence de redondance sur toutes les pages.
- Résultat : Tous les tests validés, UX conforme aux attentes.

### [2024-05-23] Tests timeline serpentin
- Testé avec 2 à 6 étapes, alternance gauche/droite OK.
- Responsive testé sur desktop et mobile (Chrome, Firefox).
- Test de lisibilité, effet flat, palette couleur.
- Cas à tester : très petits écrans, très grand nombre d'étapes, accessibilité, performance SVG.
- À prévoir : tests d'intégration avec données Firestore réelles.

---

# Historique des tests manuels

| Date       | Écran         | Action/test                                 | Résultat observé                | Succès | Remarque                      |
|------------|---------------|---------------------------------------------|----------------------------------|--------|-------------------------------|
| 2024-05-16 | Home (Landing)| Affichage page d'accueil, pipe translate    | Affiche la clé brute (corrigé)   | NON    | Problème de scope/fichier     |
| 2024-05-16 | Home (Landing)| Affichage page d'accueil, pipe translate    | Affiche la traduction attendue   | OUI    | Après correction service      |
| 2024-06-XX | Auth         | Réinitialisation mot de passe              | Email reçu, lien fonctionnel     | OUI    | Flux complet validé           |
| 2024-06-XX | Auth         | Création de compte + vérification email     | Email reçu, validation OK, accès app | OUI    | Flux complet validé           |

---

Ce plan sera enrichi à chaque nouvelle fonctionnalité ou évolution UX/UI.

- [x] Test manuel : Changement de langue dynamique sur la page d'inscription (FR/EN)
  - Ouvrir la page d'inscription
  - Changer la langue via le select
  - Vérifier que tous les labels et messages s'affichent dans la langue choisie instantanément
  - Rafraîchir la page : la langue choisie doit être conservée
- [x] Test manuel : Initialisation globale de la langue utilisateur
  - Supprimer la clé 'lang' du localStorage
  - Recharger l'app : la langue du navigateur doit être appliquée
  - Changer la langue, recharger : la langue choisie doit rester active
- [x] Test manuel : Mot de passe oublié ?
  - Saisir un email existant, cliquer sur le bouton : message de succès affiché, email reçu
  - Saisir un email inexistant : message utilisateur explicite affiché
  - Saisir un email Yahoo, Gmail, Outlook : vérifier la délivrabilité
- [x] Test manuel : Création de compte et réception de l'email de vérification
  - Saisir un nouvel email, vérifier la réception de l'email
  - Tester avec SMTP Firebase natif et SMTP Zoho

# Plan de tests

- Vérifier que le spinner s'affiche pendant le chargement des étapes et que le message 'Aucune étape' n'apparaît qu'après le chargement
- Vérifier que les badges de type de plan sont traduits dynamiquement selon la langue (fr/en)
- Vérifier que tout nouveau type de plan ajouté s'affiche correctement (clé de traduction à ajouter si besoin)
- Vérifier la rapidité du chargement des plans (pas de délai artificiel) 