# Documentation de la Navigation et des Processus — BoB App

## Écrans principaux

- Splash/Loading
- Login
- Inscription
- Reset Password
- Landing (Dashboard/Tuiles)
- Voyages (Liste)
- Détail Voyage
- Fenêtre (Window)
- Chat
- Bobbers (Communauté)
- Jeux
- Notifications
- Documents
- Support
- Préférences
- Profil Utilisateur

## Transitions principales

- Splash → Login (si non authentifié)
- Splash → Landing (si authentifié)
- Login → Landing (après succès)
- Login → Inscription / Reset Password
- Landing → [toutes les pages via tuiles/menu]
- Voyages (Liste) → Détail Voyage
- Menu latéral accessible partout (sauf Splash/Login)
- Logout → Login

## Processus associés

- Authentification : login, logout, reset password, inscription, vérification email
- Parsing email : déclenché après login ou en tâche de fond, écrit dans Firestore
- Synchronisation Firestore : lecture/écriture des voyages/plans
- Changement de langue : accessible depuis préférences ou page d'inscription
- Gestion des notifications : affichage, marquage comme lues
- Gestion des erreurs : accès refusé, email non vérifié, etc.

## Diagramme de navigation

- Voir `navigation_flow.drawio` (éditable dans draw.io)
- Export PDF/PNG pour consultation rapide

---

**À mettre à jour à chaque évolution majeure de l'UX ou des processus.** 