# Documentation du Parsing Email – BoB Backend

## Stratégies de Parsing

Le backend BoB utilise plusieurs stratégies pour extraire des plans de voyage à partir des emails :

1. **Parsing spécifique** :
   - Pour certains fournisseurs (ex : EasyJet), un parser dédié extrait les informations structurées (vols, horaires, passagers, etc.).
2. **Parsing générique TripIt-like** :
   - Pour les emails au format proche de TripIt, extraction basée sur des patterns connus.
3. **Parsing classique (fallback)** :
   - Extraction basique sur le texte brut si aucun format reconnu.
4. **Parsing IA (OpenAI)** :
   - Si aucun parser n'a fonctionné, le contenu est envoyé à OpenAI avec un prompt détaillé pour obtenir un JSON structuré des plans détectés.

## Types d'Informations Extraites

- **Vols** : numéro, compagnie, horaires, aéroports, terminal, siège, classe, bagages, etc.
- **Hôtels** : nom, adresse, dates, type de chambre, numéro de réservation.
- **Location de voiture** : société, type, lieux de prise/dépose, référence.
- **Activités** : nom, description, durée, référence.
- **Trains/Ferry** : numéro, opérateur, gares/ports, horaires, classe, siège.
- **Restaurants** : nom, cuisine, heure, nombre de personnes, numéro de réservation.
- **Meetings** : titre, description, participants, lieu, lien.

## Enrichissements Automatiques

- **FlightRadar24** :
  - Pour les plans de type "flight", enrichissement automatique avec les données publiques FR24 (type avion, distance, durée, météo, aéroports, etc.).
  - Ajout de sous-champs dans `details.flight` (aircraft, route, weather, airports).

## Structure de Données Stockée (Firestore)

### Collection `trips`
- `userId` : identifiant utilisateur
- `title` : titre du voyage
- `startDate` / `endDate` : bornes du voyage (ISO 8601)
- `createdAt` / `updatedAt` : dates système
- `status` : état du voyage
- `plans` : tableau d'ID de plans associés
- `metadata` :
    - `source` : provider d'origine
    - `lastEmailParsed` : référence email (si dispo)

### Collection `plans`
- `type` : flight, hotel, car_rental, etc.
- `title` : titre du plan
- `startDate` / `endDate` : dates du plan (ISO 8601)
- `location` : nom, adresse, ville, pays, coordonnées
- `details` : sous-objet selon le type (voir plus bas)
- `source` : type, provider, référence
- `createdAt` / `updatedAt` : dates système
- `tripId` : référence au trip parent
- `status` : état du plan
- `metadata` :
    - `source` : provider d'origine
    - `emailReference` : référence email (si dispo)
    - `parsedAt` : date de parsing

#### Exemple de JSON stocké (plan de vol)
```json
{
  "type": "flight",
  "title": "Flight from Genève to Bruxelles Intl",
  "startDate": "2025-06-05T14:10:00.000Z",
  "endDate": "2025-06-05T15:30:00.000Z",
  "location": {
    "name": "Genève Aéroport",
    "address": "Route de l'Aéroport 21, 1215 Genève, Suisse",
    "city": "Genève",
    "country": "Suisse",
    "coordinates": { "latitude": 46.2381, "longitude": 6.1089 }
  },
  "details": {
    "flight": {
      "flight_number": "EZS1529",
      "airline": "easyJet",
      "departure": { "airport": "Genève", "terminal": null, "gate": null },
      "arrival": { "airport": "Bruxelles Intl", "terminal": null, "gate": null },
      "class": null,
      "seat": null,
      "booking_reference": "ABC123",
      "fr24_enrichment": {
        "aircraft": { "type": "A320", "registration": "HB-JXA", "age": 5 },
        "route": { "distance": 530, "duration": 80, "waypoints": [] },
        "weather": { "temperature": 18, "conditions": "Clear" },
        "airports": {
          "departure": { "code": "GVA", "name": "Genève", "city": "Genève", "country": "Suisse", "coordinates": { "latitude": 46.2381, "longitude": 6.1089 } },
          "arrival": { "code": "BRU", "name": "Bruxelles Intl", "city": "Bruxelles", "country": "Belgique", "coordinates": { "latitude": 50.9014, "longitude": 4.4844 } }
        }
      }
    }
  },
  "source": { "type": "email", "provider": "zoho", "reference": "12345" },
  "createdAt": "2025-05-17T16:21:19.674Z",
  "updatedAt": "2025-05-17T16:21:19.674Z",
  "tripId": "UsjZv5vK6pEl7PMXNmOm",
  "status": "active",
  "metadata": { "source": "zoho", "emailReference": "12345", "parsedAt": "2025-05-17T16:21:19.674Z" }
}
```

## Règles de Robustesse
- Jamais de valeur `undefined` dans les documents Firestore (tous les champs sont testés avant insertion)
- Dates toujours au format ISO 8601
- Champs obligatoires toujours présents (null si non dispo)
- Logs détaillés à chaque étape (parsing, enrichissement, Firestore)
- Gestion des erreurs : chaque erreur est logguée, le parsing continue sur les autres emails

## Logs et Gestion des Erreurs
- Chaque étape du parsing, enrichissement, et stockage est logguée (fichier + console)
- Les erreurs OpenAI, Firestore, ou parsing sont capturées et n'interrompent pas le traitement global
- Les plans sont stockés même si l'enrichissement échoue (log d'erreur mais pas de blocage)

## Prompt IA Utilisé (résumé)
- Demande un JSON strict, formaté selon un schéma précis (voir code)
- Retourne un tableau de plans ou un tableau vide
- Dates ISO, champs null si non dispo, jamais de undefined
- Ajout d'informations source (provider, référence email)

## Évolutions Possibles
- Ajout de nouveaux types de plans (bus, événements, etc.)
- Enrichissement avec d'autres APIs (hôtels, météo, etc.)
- Parsing multilingue
- Notification utilisateur après parsing

---

Pour toute extension ou debug, se référer à ce document et au code source du backend (bobparser-ai.js). 