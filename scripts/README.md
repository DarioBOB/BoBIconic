# Scripts de gestion des données démo

Ce dossier contient les scripts pour gérer les données de démonstration dans Firestore.

## Scripts disponibles

### 1. Chargement du voyage démo Montréal

**Fichier:** `load-montreal-demo-trip.js`

**Description:** Crée un voyage complet "Genève-Montréal / Road Trip Québec 15 jours" pour l'utilisateur démo avec tous les plans détaillés.

**Usage:**
```bash
npm run load-demo-trip
```

**Ce que fait le script:**
- Crée un voyage principal avec les métadonnées
- Ajoute 2 vols (aller/retour)
- Ajoute 2 locations de voiture (Montréal et Gaspé)
- Ajoute 5 hôtels (Montréal, Québec, Gaspé, Percé, Rimouski, Tadoussac)
- Ajoute 8 activités/transports (visites, routes, excursions)

**Structure du voyage:**
1. **Vol aller:** Genève → Montréal (EasyJet U2 5129)
2. **Location voiture:** Montréal Aéroport (Avis)
3. **Hôtel:** Montréal (Bonaventure) - 2 nuits
4. **Activité:** Vieux-Montréal & Mont Royal
5. **Route:** Montréal → Québec City
6. **Hôtel:** Québec City (Auberge Saint-Antoine) - 3 nuits
7. **Activité:** Chute Montmorency + Croisière
8. **Vol interne:** Québec → Gaspé (Air Canada AC8832)
9. **Location voiture:** Gaspé (Budget)
10. **Hôtel:** Gaspé (Baker) - 3 nuits
11. **Activité:** Parc Forillon + Baleines
12. **Route:** Gaspé → Percé
13. **Hôtel:** Percé (Riôtel) - 2 nuits
14. **Activité:** Rocher Percé + Île Bonaventure
15. **Route:** Percé → Rimouski
16. **Hôtel:** Rimouski - 1 nuit
17. **Activité:** Sous-marin Onondaga + Phare
18. **Route:** Rimouski → Tadoussac (ferry)
19. **Hôtel:** Tadoussac - 2 nuits
20. **Activité:** Safari baleines Zodiac
21. **Route:** Retour à Montréal
22. **Hôtel:** Montréal (Le Germain) - 2 nuits
23. **Retour voiture:** Montréal Aéroport
24. **Vol retour:** Montréal → Genève (SWISS LX 87)

### 2. Nettoyage des données démo

**Fichier:** `clean-demo-data.js`

**Description:** Supprime tous les voyages et plans créés par l'utilisateur démo.

**Usage:**
```bash
npm run clean-demo-data
```

**Ce que fait le script:**
- Supprime tous les voyages avec `createdByDemo: true`
- Supprime tous les plans associés à ces voyages
- Supprime les plans démo orphelins

### 3. Migration des plans pour uniformisation

**Fichier:** `migrate-plans-uniform.js`

**Description:** Uniformise la structure de tous les documents de la collection `plans` dans Firestore pour garantir la cohérence, la complétude des champs, et la compatibilité avec le modèle professionnel de l'application.

**Usage:**
```bash
node scripts/migrate-plans-uniform.js
```

**Ce que fait le script :**
- S'assure que chaque plan possède les champs obligatoires (`id`, `tripId`, `userId`, `title`, `description`, `type`, `startDate`, `endDate`, `details`, `createdByDemo`, `createdAt`, `updatedAt`).
- Convertit les dates en Timestamp Firestore si besoin.
- Ajoute les champs manquants avec des valeurs par défaut professionnelles.
- Nettoie les champs optionnels (`status`, `startTime`, `endTime`) si absents.
- Log chaque plan modifié ou déjà conforme.
- Affiche un message de succès clair à la fin.

## Configuration

### Utilisateur démo
- **ID:** `fUBBVpboDeaUjD6w2nz0xKni9mG3`
- **Utilisé dans:** Tous les scripts de démo

### Base de données
- **Projet Firebase:** `bob-app-9cbfe`
- **Collections utilisées:**
  - `trips` - Voyages
  - `plans` - Plans de voyage

## Structure des données

### Voyage (trips)
```javascript
{
  title: { fr: string, en: string },
  description: { fr: string, en: string },
  startDate: Timestamp,
  endDate: Timestamp,
  userId: string,
  type: 'vacation',
  from: string,
  to: string,
  createdByDemo: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Plan (plans)
```javascript
{
  tripId: string,
  type: 'flight' | 'hotel' | 'car_rental' | 'activity',
  title: { fr: string, en: string },
  description: { fr: string, en: string },
  startDate: Timestamp,
  endDate: Timestamp,
  userId: string,
  createdByDemo: true,
  details: {
    flight?: { /* détails vol */ },
    hotel?: { /* détails hôtel */ },
    car_rental?: { /* détails location */ },
    activity?: { /* détails activité */ }
  }
}
```

## Utilisation recommandée

1. **Pour tester l'application:**
   ```bash
   npm run load-demo-trip
   ```

2. **Pour nettoyer avant un nouveau test:**
   ```bash
   npm run clean-demo-data
   npm run load-demo-trip
   ```

3. **Pour nettoyer après les tests:**
   ```bash
   npm run clean-demo-data
   ```

## Notes importantes

- Les dates sont fixées en septembre 2025 mais seront recalculées dynamiquement dans l'application
- Tous les éléments sont marqués avec `createdByDemo: true` pour faciliter le nettoyage
- Les données sont multilingues (français/anglais)
- Les scripts utilisent la même configuration Firebase que l'application principale 