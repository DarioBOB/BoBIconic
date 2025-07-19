# Implémentation du Recalage Dynamique des Voyages Démo

## Contexte

Le `DemoService` a été modifié pour implémenter un recalage dynamique des dates des voyages de démo selon les spécifications du fichier `Requirements Démo.txt`.

## Modifications Apportées

### 1. Identification des Voyages par Status

**Avant :** Les voyages étaient identifiés par leur titre (recherche partielle)
```typescript
const getTripByTitle = (title: string) =>
  rawTrips.find(t => t.title.toLowerCase().includes(title.toLowerCase()));

const pastTplSrc = getTripByTitle('Marrakech');
const ongoingTplSrc = getTripByTitle('Athènes');
const futureTplSrc = getTripByTitle('Montréal');
```

**Après :** Les voyages sont identifiés par leur champ `status`
```typescript
const pastTplSrc = rawTrips.find(t => t['status'] === 'past');
const ongoingTplSrc = rawTrips.find(t => t['status'] === 'ongoing');
const futureTplSrc = rawTrips.find(t => t['status'] === 'upcoming');
```

### 2. Nouvelles Fonctions de Recalage

#### `recalagePastDemoTrip(trip, now)`
- **Requirements :** début = maintenant – 37 jours, fin = maintenant – 30 jours
- **Implémentation :**
  ```typescript
  const newStart = new Date(now.getTime() - 37 * MS_IN_DAY);
  const newEnd = new Date(now.getTime() - 30 * MS_IN_DAY);
  const offset = newStart.getTime() - originalStart.getTime();
  ```

#### `recalageFutureDemoTrip(trip, now)`
- **Requirements :** début = maintenant + 60 jours, fin = maintenant + 67 jours
- **Implémentation :**
  ```typescript
  const newStart = new Date(now.getTime() + 60 * MS_IN_DAY);
  const newEnd = new Date(now.getTime() + 67 * MS_IN_DAY);
  const offset = newStart.getTime() - originalStart.getTime();
  ```

#### `recalageOngoingDemoTrip(trip, now)`
- **Requirements :** 
  - Identifier le premier plan vol (le plus ancien)
  - Calculer sa durée = originalEnd – originalStart
  - Positionner son nouveau départ à now – durée / 3
  - offset = newFirstFlightStart – originalFirstFlightStart
  - Appliquer cet offset à toutes les dates du trip
- **Implémentation :**
  ```typescript
  const firstFlight = trip.plans
    .filter(p => p.type === 'flight')
    .sort((a, b) => this.toDate(a.startDate).getTime() - this.toDate(b.startDate).getTime())[0];
  
  const flightDuration = origFlightEnd.getTime() - origFlightStart.getTime();
  const newFlightStart = new Date(now.getTime() - flightDuration / 3);
  const offsetOngoing = newFlightStart.getTime() - origFlightStart.getTime();
  ```

### 3. Gestion des Erreurs

**Avant :** Retour des données brutes en cas de voyage manquant
```typescript
if (!pastTplSrc || !ongoingTplSrc || !futureTplSrc) {
  console.warn('⚠️ Voyages manquants, retour des données brutes');
  return rawTrips;
}
```

**Après :** Log d'erreur explicite et retour des données brutes
```typescript
if (!pastTplSrc || !ongoingTplSrc || !futureTplSrc) {
  const missingTrips = [];
  if (!pastTplSrc) missingTrips.push('past');
  if (!ongoingTplSrc) missingTrips.push('ongoing');
  if (!futureTplSrc) missingTrips.push('upcoming');
  
  console.error(`❌ Voyages manquants: ${missingTrips.join(', ')}. Impossible de procéder au recalage dynamique.`);
  return rawTrips;
}
```

## Tests

### Test Unitaire
Fichier : `src/app/services/demo.service.spec.ts`
- Teste les trois fonctions de recalage avec une date fixe (`2025-07-04T12:00:00Z`)
- Vérifie les calculs de dates et d'offsets
- Valide la cohérence des horaires de vol

### Script de Test
Fichier : `test-demo-recalage.js`
- Simule les calculs avec une date fixe
- Affiche les résultats détaillés
- Vérifie que le vol en cours est bien en cours maintenant

## Résultats des Tests

Avec `now = 2025-07-04T12:00:00Z` :

### Voyage Passé (Marrakech)
- **Nouvelles dates :** 2025-05-28 → 2025-06-04
- **Offset :** 408 jours
- **Vérification :** ✅ Respecte les requirements (now - 37j, now - 30j)

### Voyage Futur (Montréal)
- **Nouvelles dates :** 2025-09-02 → 2025-09-09
- **Offset :** -8 jours
- **Vérification :** ✅ Respecte les requirements (now + 60j, now + 67j)

### Voyage en Cours (Athènes)
- **Vol positionné :** 2025-07-04T10:50:00Z → 2025-07-04T14:20:00Z
- **Temps écoulé :** 1.2 heures
- **Temps restant :** 2.3 heures
- **Vérification :** ✅ Vol en cours maintenant, positionné à now - durée/3

## Contraintes Techniques Respectées

1. ✅ **Identification par status** : Utilisation du champ `status` au lieu de recherche par titre
2. ✅ **Cohérence des fuseaux horaires** : Conservation des horaires relatifs
3. ✅ **Appel forcé des fonctions** : Les trois fonctions sont appelées si les voyages existent
4. ✅ **Gestion d'erreur** : Log explicite en cas de template manquant
5. ✅ **Recalage de tous les plans** : Application de l'offset à tous les plans du voyage

## Utilisation

Le recalage dynamique est automatiquement appliqué lors de l'appel à `getDynamicDemoData()`. Les voyages de démo dans Firestore doivent avoir les champs `status` suivants :
- `'past'` pour le voyage passé (Marrakech)
- `'ongoing'` pour le voyage en cours (Athènes)
- `'upcoming'` pour le voyage futur (Montréal) 