# Mode Démo - Résumé des Modifications

## 🎯 Objectif
Faire fonctionner le mode démo comme prévu avec :
- Authentification démo (bouton et email)
- Affichage des voyages démo avec décalages temporels
- Callsign du vol en cours passé automatiquement à la fenêtre window

## 🔧 Modifications Apportées

### 1. Page des Voyages (`src/app/pages/trips.page.ts`)
**Problème** : La page chargeait les voyages démo directement depuis Firestore sans appliquer les décalages temporels.

**Solution** : Modification de la méthode `loadTrips()` pour utiliser `DemoService.getDynamicDemoData()` quand l'utilisateur est en mode démo.

```typescript
// Avant : Chargement direct depuis Firestore
const q = query(collection(this.firestore, 'trips'), where('createdByDemo', '==', true));

// Après : Utilisation du DemoService avec décalages dynamiques
const dynamicTrips = await this.demoService.getDynamicDemoData();
```

### 2. Service Window (`src/app/services/window.service.ts`)
**Problème** : Le service ne prenait pas en compte les décalages temporels du mode démo pour détecter les voyages en cours.

**Solution** : Modification des méthodes `getOngoingTrips()` et `getFlightPlans()` pour utiliser le DemoService quand l'utilisateur est en mode démo.

```typescript
// Détection du mode démo
const isDemoUser = user && (
  user.uid === 'fUBBVpboDeaUjD6w2nz0xKni9mG3' || 
  user.uid === 'guest-demo' ||
  user.email?.endsWith('@demo.com')
);

if (isDemoUser) {
  // Utiliser DemoService pour les données avec décalages
  const dynamicTrips = await this.demoService.getDynamicDemoData();
}
```

### 3. Authentification Démo (`src/app/pages/email-auth/email-auth.page.ts`)
**Statut** : ✅ Déjà fonctionnel
- Bouton "Tester l'application" utilise `DemoService.activateDemo()`
- Email démo : `guestuser@demo.com`
- Mot de passe démo : `DemoPassword123!`

### 4. DemoService (`src/app/services/demo.service.ts`)
**Statut** : ✅ Déjà fonctionnel
- Méthode `getDynamicDemoData()` applique les décalages temporels
- Voyage en cours : vol positionné au 1/3 de sa durée
- Voyage passé : 30 jours avant la date actuelle
- Voyage futur : 60 jours après la date actuelle

## 🎮 Fonctionnement du Mode Démo

### Authentification
1. **Bouton démo** : Cliquer sur "Tester l'application" sur la page de connexion
2. **Email démo** : Se connecter avec `guestuser@demo.com` / `DemoPassword123!`

### Affichage des Voyages
- **Voyage passé** : Marrakech (30 jours avant)
- **Voyage en cours** : Athènes (vol au 1/3 de sa durée)
- **Voyage futur** : Montréal (60 jours après)

### Callsign Automatique
- La fenêtre window détecte automatiquement le voyage en cours
- Extrait le callsign du plan de vol (ex: "LX1234")
- Lance automatiquement la recherche de vol

## 🧪 Test du Mode Démo

### Étapes de Test
1. Ouvrir http://localhost:8100
2. Cliquer sur "Tester l'application"
3. Vérifier que les 3 voyages démo s'affichent avec les bons statuts
4. Aller sur la page "Voyages" pour voir les décalages temporels
5. Aller sur la fenêtre window pour voir le callsign automatique

### Vérifications
- ✅ Authentification démo fonctionne
- ✅ Voyages démo s'affichent avec décalages
- ✅ Voyage en cours détecté automatiquement
- ✅ Callsign extrait et passé à la fenêtre window
- ✅ Plans de vol détaillés disponibles

## 📋 Données Démo

### Voyages Disponibles
1. **Marrakech** (passé) - Voyage culturel au Maroc
2. **Athènes** (en cours) - Découverte de la Grèce antique
3. **Montréal** (futur) - Exploration du Québec

### Plans de Vol
- **LX1234** : Genève → Athènes (vol en cours au 1/3)
- **AC123** : Genève → Montréal (vol futur)
- **AT123** : Genève → Marrakech (vol passé)

## 🔄 Décalages Temporels

Le DemoService recalcule dynamiquement les dates :
- **Maintenant** : Date actuelle
- **Voyage en cours** : Vol positionné au 1/3 de sa durée
- **Voyage passé** : 30 jours avant maintenant
- **Voyage futur** : 60 jours après maintenant

Cela garantit que la démo reste toujours pertinente et qu'il y a toujours un voyage en cours avec un vol actif.

## Note sur la capture des logs navigateur

La capture automatique des logs navigateur (console Opera, etc.) a été désactivée pour éviter les conflits de port et simplifier le mode démo. Seul le log-proxy classique est utilisé pour la collecte des logs. 