# Cahier des charges high level – Application BoB (Bored On Board)

## 1. Authentification & Utilisateur
**Objectif :** Créer un système d'identification pour accéder aux fonctionnalités sociales et personnalisées.
- Écran d'accueil avec options de connexion : Email + mot de passe, Google, Facebook, LinkedIn
- Intégration Firebase Auth + SDKs OAuth
- Stockage Firestore du profil utilisateur (AppUser)
- Gestion de l'état de connexion (auth bloc/provider)

## 2. Gestion des voyages
**Objectif :** Permettre à l'utilisateur de créer, consulter, modifier ses voyages.
- Liste des voyages de l'utilisateur (page principale)
- Ajout d'un voyage (formulaire)
- Modification / Suppression
- Synchronisation avec Firestore (CRUD complet)
- Import par email (fonction future, automatique via inbox parser)

## 3. "Through my window" – Carte en vol interactive
**Objectif :** Afficher la position actuelle de l'avion + les éléments géographiques visibles autour.
- Intégration Mapbox pour carte embarquée
- Simuler ou récupérer la position GPS de l'avion
- Afficher les POIs sous la trajectoire (via API Wikipedia/GeoNames)
- Tap sur un POI = fiche info (ville, monument, curiosité…)

## 4. Réseau social voyageur
**Objectif :** Créer une communauté autour de l'avion et du voyage.
- Voir qui est dans le même avion
- Chat entre passagers (via Firestore / Firebase Messaging)
- Demande d'amis / co-taxi / co-hébergement
- Voir qui est déjà allé à la destination
- Notifications "ami dans l'avion", "ami à destination"

## 5. Divertissement à bord (Jeux & Quiz)
**Objectif :** Proposer des mini-jeux aux utilisateurs pour passer le temps
- Quiz liés aux destinations, préférences utilisateurs
- Jeux simples multijoueurs (type devine qui je suis ?)
- Matchmaking local (joueurs connectés sur même vol)
- Jeux offline en fallback

## 6. Informations d'arrivée
**Objectif :** Offrir une vraie expérience à l'atterrissage.
- Infos sur l'aéroport de destination
- Bagages, connexions, transports
- Plan du terminal
- Réservation de taxi (via deep link ou formulaire)
- Notification post-atterrissage : "Laissez un avis", "Photos ?"

## 7. Évaluation de l'expérience
**Objectif :** Collecter des retours utilisateur sur tous les aspects du vol
- Noter : le vol, l'avion, le personnel, le siège, la nourriture, l'aéroport
- Option de commentaire libre

## 8. Notifications & alertes
**Objectif :** Informer l'utilisateur de manière proactive
- Retards de vol
- Amis dans l'avion
- Changement de terminal
- Suggestions de lieux à survoler
- Push avec firebase_messaging

## 9. Intégrations & APIs
**Objectif :** BoB exploite des services tiers pour enrichir l'expérience
- FlightRadar24 (ou équivalent open data)
- Wikipedia / GeoNames
- IATA / OpenFlights pour infos aéroports
- Email parsing (futur : parser confirmations)

## 10. Business model & monétisation (phase 2)
- Application gratuite
- Certaines fonctionnalités premium (ex : jeux, assistant perso)
- Intégration d'annonces contextuelles (AdMob)
- Partenariats avec compagnies aériennes, hôtels, etc.

---

### Conclusion :
L'application BoB est structurée autour de 3 piliers :
| Pilier | Fonctions principales |
|--------|----------------------|
| 🧠 Intelligence contextuelle | carte, contenu local, recommandations |
| 👥 Dimension sociale | chat, réseau passagers, entraide |
| 🎮 Divertissement & fun | jeux, quiz, expérience utilisateur fluide |

---

# Plan d'action détaillé – Authentification & Gestion utilisateur (Firebase)

## Objectif principal
Permettre à un utilisateur de se connecter à l'application BoB via :
- Email & mot de passe
- Google
- Facebook
- LinkedIn
Et de créer son profil utilisateur (Firestore) pour la suite des fonctionnalités personnalisées.

## Sous-objectifs
| Objectif | Type |
|----------|------|
| Implémenter UI de login/inscription | Frontend |
| Configurer Firebase Auth | Backend |
| Gérer l'état de l'utilisateur | State mgmt |
| Créer ou charger un profil utilisateur (AppUser) | Firestore |

## Étapes détaillées
1. **Configuration Firebase Auth (console Firebase)**
   - Fournisseurs d'identité à activer : Email / mot de passe, Google (SHA-1 requis), Facebook, LinkedIn (OAuth manuel)
2. **UI – Création des écrans**
   - AuthPage (choix de méthode)
   - EmailAuthPage (formulaire)
   - RegisterProfilePage (si compte nouvellement créé)
3. **Fonctionnalité : Auth avec Firebase**
   - Email : firebase_auth
   - Google : google_sign_in + firebase_auth
   - Facebook : flutter_facebook_auth + firebase_auth
   - LinkedIn : flutter_linkedin_login ou webview OAuth
4. **Backend : Modèle AppUser (dans Firestore)**
   - Champs : uid, email, displayName, photoUrl, provider, createdAt, lastLogin
5. **Gestion d'état (Bloc ou Provider)**
   - Sur authStateChanges(), vérifier si l'utilisateur existe déjà dans Firestore
   - Gérer les cas de déconnexion, token expiré, suppression, etc.
6. **Redirections post-login**
   - Connecté & profil existant : TripsPage
   - Connecté & pas de profil : RegisterProfilePage
   - Déconnecté : AuthPage
7. **Tests à prévoir**
   - Création via email, Connexion avec Google, Facebook, LinkedIn, Tentative de double compte, Déconnexion

## Estimation effort (approx.)
| Tâche | Jours |
|-------|-------|
| UI/UX pages Auth | 1.5j |
| Config Firebase + Google/Fb | 0.5j |
| LinkedIn OAuth (si custom) | 1.5j |
| Firestore user model | 0.5j |
| AuthBloc + Redirections | 1j |
| Tests & débogage | 1j |
| **Total estimé** | **6j** |

---

Ajouter la possibilité d'avoir un Wallet avec tous les vouchers ! tickets d'avions, entrées, réservations, etc. 