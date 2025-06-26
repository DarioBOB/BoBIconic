# Migration vers FlightRadar24 - Architecture Hybride

## Vue d'ensemble

BoBIconic utilise maintenant une **architecture hybride** avec FlightRadar24 :
- **FR24Service** : Appels directs à l'API FlightRadar24 pour les données de vol
- **Serveur FR24 local** : Proxy local pour météo et photos d'avions

## Architecture Actuelle

### 🚀 **Services Actifs**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   BoBIconic     │    │  Serveur FR24   │    │  API FR24       │
│   (port 8100)   │───▶│  (port 5001)    │───▶│  (externe)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  FR24Service    │    │  Météo/Photos   │
│  (direct API)   │    │  (proxy local)  │
└─────────────────┘    └─────────────────┘
```

### 📊 **Répartition des Fonctionnalités**

| Fonctionnalité | Méthode | Service |
|---|---|---|
| **Données de vol** | Direct API | FR24Service |
| **Météo** | Proxy local | Serveur FR24 |
| **Photos d'avions** | Proxy local | Serveur FR24 |
| **Voyage démo dynamique** | Direct API | FR24Service |

## Changements Effectués

### 1. Services Supprimés

- **OpenSky Proxy** (port 3000) : Plus nécessaire
- **Dépendances Python** : Flask, pyflightdata, etc.

### 2. Nouveaux Services

- **FR24Service** : Service Angular dédié à FlightRadar24
- **API directe** : Appels directs à l'API FlightRadar24
- **Fallback robuste** : Données statiques en cas d'échec

### 3. Scripts Adaptés

#### `start-all.bat` (Architecture Hybride)
- ✅ Vérification Node.js + Python
- ✅ Installation dépendances npm + pip
- ✅ Démarrage serveur FR24 (port 5001)
- ✅ Démarrage application BoBIconic (port 8100)
- ✅ Gestion des fenêtres de commande

#### `stop-all.bat` (Architecture Hybride)
- ✅ Arrêt serveur FR24 (port 5001)
- ✅ Arrêt application BoBIconic (port 8100)
- ✅ Fermeture fenêtres de commande

## Utilisation

### 🚀 **Démarrage**

```bash
# Windows
start-all.bat

# Ou manuellement
python fr24_server.py    # Port 5001
npm start               # Port 8100
```

### 🛑 **Arrêt**

```bash
# Windows
stop-all.bat

# Ou manuellement
# Fermer les fenêtres de commande
```

### 🌐 **Accès**

- **Application** : http://localhost:8100
- **Serveur FR24** : http://localhost:5001
- **Admin** : http://localhost:8100/admin
- **Logs** : http://localhost:8100/admin/logs

## Avantages de l'Architecture Hybride

### ✅ **Avantages**

1. **Performance optimale** : Données de vol directes via API
2. **Fonctionnalités étendues** : Météo et photos via proxy local
3. **Fiabilité** : Fallback en cas d'échec API
4. **Flexibilité** : Possibilité d'ajouter des fonctionnalités locales

### ⚠️ **Points d'Attention**

1. **Complexité** : Deux services à gérer
2. **Dépendances** : Node.js + Python requis
3. **Ports** : 5001 + 8100 utilisés

## Voyage Démo Dynamique

Le voyage démo "ongoing" utilise maintenant l'architecture hybride :

1. **Chargement** : Document Firestore `trip-ongoing`
2. **Données vol** : FR24Service (API directe)
3. **Recalage** : Position à 1/3 du vol LX1820
4. **Mise à jour** : `startDate`, `endDate`, plans

## Support

Pour toute question ou problème :
- Vérifiez les logs dans les fenêtres de commande
- Consultez l'interface admin : http://localhost:8100/admin
- Vérifiez les ports : `netstat -ano | findstr :5001` et `netstat -ano | findstr :8100` 