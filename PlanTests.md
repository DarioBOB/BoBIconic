# Plan de tests fonctionnels BoBIconicNew

## 1. Landing Page (Accueil)
- **Action** : Arriver sur la page d'accueil sans être connecté
  - **Résultat attendu** : Affichage du logo, baseline traduite, boutons Se connecter / Créer un compte / Tester l'app, background dynamique, lien Sunshine Adventures visible
- **Action** : Changer la langue (FR/EN)
  - **Résultat attendu** : Tous les textes changent instantanément

## 2. Authentification (Connexion)
- **Action** : Saisir un email et un mot de passe valides, cliquer sur Se connecter
  - **Résultat attendu** : Redirection vers la page des tuiles, affichage des voyages
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

## [2024-06-XX] Tests manuels - Header, login, backup/restore
- Vérifier qu'un seul header (barre utilisateur) est visible sur toutes les pages (landing, chat, bobbers, profil, etc.).
- Vérifier que le prénom et le nom de l'utilisateur connecté s'affichent à droite du header, à côté de l'icône de profil.
- Vérifier que le bouton Home du header redirige bien vers /landing-tiles sur toutes les pages.
- Vérifier que le bouton déconnexion fonctionne sur toutes les pages.
- Vérifier la cohérence graphique et l'absence de redondance sur toutes les pages.
- Vérifier le fonctionnement des scripts backup/restore (création/restauration d'une archive, structure fidèle).
- Résultat : Tous les tests validés, UX conforme aux attentes. 