# Système de Parsing d'Emails - BoredOnBoardIonic

## 📧 Vue d'ensemble

Ce système permet de parser automatiquement les emails de réservation de voyage reçus sur `bobplans@sunshine-adventures.net` et de les transformer en données structurées JSON pour affichage dans l'application Ionic.

## 🏗️ Architecture

### Backend (`email-parser/`)
- **`imap.service.ts`** : Connexion IMAP à Zoho Mail
- **`openai.service.ts`** : Parsing des emails avec GPT-4
- **`storage.service.ts`** : Sauvegarde des données JSON
- **`index.ts`** : Orchestrateur principal

### Frontend (`src/app/pages/parsed-mails/`)
- **`parsed-mails.page.ts`** : Composant principal
- **`parsed-mails.page.html`** : Template avec interface utilisateur
- **`parsed-mails.page.scss`** : Styles modernes et responsifs

### API REST (`server.js`)
- `POST /api/parse-mails` : Déclencher le parsing
- `GET /api/email-stats` : Statistiques des réservations
- `GET /api/parsed-bookings` : Liste des réservations avec filtres

## 🚀 Installation et Configuration

### 1. Variables d'environnement
Créer un fichier `.env` à la racine avec :

```env
# Configuration IMAP
IMAP_USER=bobplans@sunshine-adventures.net
IMAP_PASS=HzCXsEafd6PK
IMAP_HOST=imap.zoho.eu
IMAP_PORT=993

# Clé API OpenAI (obligatoire)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Autres variables existantes...
```

### 2. Installation des dépendances
```bash
npm install
```

### 3. Démarrage du serveur
```bash
npm start
```

## 📋 Utilisation

### Parsing manuel
```bash
npm run parse-mails
```

### Parsing via l'interface web
1. Aller sur `/parsed-mails` dans l'application
2. Cliquer sur "Parser Nouveaux Emails"

### Parsing via API
```bash
curl -X POST http://localhost:3000/api/parse-mails
```

## 📊 Types de réservations supportés

### ✈️ Vols (flight)
- EasyJet, Air France, etc.
- Numéro de vol, aéroports, dates, heures

### 🏨 Hôtels (hotel)
- Booking.com, Hotels.com, etc.
- Nom, adresse, dates, type de chambre

### 🚗 Location de voiture (car_rental)
- RentalCar, Europcar, etc.
- Type de voiture, lieux de retrait/retour

### 🎯 Activités (activity)
- GetYourGuide, Viator, etc.
- Type d'activité, durée, participants

### 🍽️ Restaurants (restaurant)
- Réservations de restaurants

## 📁 Structure des données

### Format JSON généré
```json
{
  "booking_type": "hotel",
  "provider": "Booking.com",
  "reference_number": "4709721403",
  "location": "Frascati",
  "checkin_date": "2025-06-20",
  "checkout_date": "2025-06-22",
  "name": "Hotel & Spa Villa Mercede",
  "price": 400,
  "currency": "EUR",
  "address": "Via Tuscolana 20, Frascati, 00044, Italie",
  "contact_info": {
    "phone": "+390699291979"
  },
  "hotel_details": {
    "room_type": "Chambre double",
    "guests": 2,
    "amenities": ["wifi", "parking"]
  },
  "tags": ["italie", "spa"],
  "confidence": 0.95,
  "raw_email_id": "email_123",
  "parsed_at": "2024-01-01T12:00:00Z"
}
```

### Stockage
- Fichiers JSON dans `./parsed-emails/`
- Nommage : `booking_<timestamp>_<email_id>.json`

## 🔍 Fonctionnalités de recherche

### Filtres disponibles
- **Type de réservation** : flight, hotel, car_rental, activity, restaurant
- **Fournisseur** : Booking.com, EasyJet, etc.
- **Recherche textuelle** : nom, lieu, référence

### Statistiques
- Total des réservations
- Répartition par type
- Répartition par fournisseur

## 🎨 Interface utilisateur

### Design moderne
- Cartes avec couleurs par type
- Animations fluides
- Responsive design
- Support thème sombre

### Fonctionnalités
- Recherche en temps réel
- Filtres multiples
- Affichage détaillé par réservation
- Actualisation automatique

## 🔧 Développement

### Structure des fichiers
```
email-parser/
├── imap.service.ts      # Service IMAP
├── openai.service.ts    # Service OpenAI
├── storage.service.ts   # Service stockage
├── index.ts            # Point d'entrée
└── package.json        # Dépendances

src/app/pages/parsed-mails/
├── parsed-mails.page.ts
├── parsed-mails.page.html
├── parsed-mails.page.scss
├── parsed-mails.module.ts
└── parsed-mails-routing.module.ts
```

### Tests
```bash
# Test du parsing
node scripts/parse-mails.js

# Test des statistiques
curl http://localhost:3000/api/email-stats
```

## 🚨 Dépannage

### Erreurs courantes

#### Connexion IMAP échouée
- Vérifier les credentials dans `.env`
- Vérifier la connectivité réseau
- Vérifier les paramètres Zoho Mail

#### Erreur OpenAI
- Vérifier la clé API dans `.env`
- Vérifier les quotas OpenAI
- Vérifier la connectivité internet

#### Aucun email parsé
- Vérifier qu'il y a des emails non lus
- Vérifier les logs du serveur
- Vérifier la configuration du prompt

### Logs
Les logs sont disponibles dans :
- Console du serveur Node.js
- Console du navigateur (F12)
- Fichiers de log dans `logs/`

## 🔒 Sécurité

### Bonnes pratiques
- Ne jamais commiter le fichier `.env`
- Utiliser des clés API avec restrictions
- Limiter l'accès aux endpoints sensibles
- Valider les données d'entrée

### Variables sensibles
- `IMAP_PASS` : Mot de passe IMAP
- `OPENAI_API_KEY` : Clé API OpenAI
- `FIREBASE_*` : Clés Firebase

## 📈 Évolutions futures

### Fonctionnalités prévues
- [ ] Parsing automatique périodique
- [ ] Notifications push
- [ ] Export PDF des réservations
- [ ] Intégration calendrier
- [ ] Synchronisation cloud
- [ ] Support multi-langues

### Améliorations techniques
- [ ] Cache Redis pour les performances
- [ ] Base de données PostgreSQL
- [ ] API GraphQL
- [ ] Tests unitaires complets
- [ ] CI/CD pipeline

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs d'erreur
2. Consulter ce README
3. Vérifier la configuration
4. Contacter l'équipe de développement

---

**Développé pour BoredOnBoardIonic** 🚀 