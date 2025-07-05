# 🚀 Scripts de Démarrage et d'Arrêt - BoBIconic

## 📋 Vue d'ensemble

BoBIconic utilise plusieurs services qui doivent être démarrés ensemble pour un fonctionnement optimal. Des scripts batch ont été créés pour automatiser ce processus.

## 🔧 Services Inclus

### 1. **Application BoBIconic** (Port 8100)
- **Framework** : Ionic/Angular 19
- **Fonction** : Interface utilisateur principale
- **URL** : http://localhost:8100
- **Admin** : http://localhost:8100/admin

### 2. **Serveur Proxy OpenSky** (Port 3000)
- **Framework** : Node.js/Express
- **Fonction** : Proxy OAuth2 pour l'API OpenSky Network
- **Fichier** : `server.js`
- **URL** : http://localhost:3000

### 3. **Serveur FR24** (Port 5001)
- **Framework** : Python/Flask
- **Fonction** : API pour les données FlightRadar24 et météo
- **Fichier** : `fr24_server.py`
- **URL** : http://localhost:5001

## 🎯 Scripts Disponibles

### `start-all.bat` - Démarrage Complet

#### Fonctionnalités
- ✅ **Vérification des prérequis** : Node.js et Python
- ✅ **Installation automatique** des dépendances manquantes
- ✅ **Démarrage séquentiel** des services
- ✅ **Gestion des erreurs** avec messages informatifs
- ✅ **Interface utilisateur** avec informations détaillées

#### Utilisation
```bash
# Double-clic sur le fichier ou
start-all.bat
```

#### Processus de Démarrage
1. **Vérification Node.js** : S'assure que Node.js est installé
2. **Vérification Python** : S'assure que Python est installé
3. **Dépendances Node.js** : Installe `npm install` si nécessaire
4. **Dépendances Python** : Installe `flask`, `flask-cors`, `pyflightdata`, `requests`
5. **Démarrage OpenSky** : Lance le proxy sur le port 3000
6. **Démarrage FR24** : Lance le serveur sur le port 5001
7. **Démarrage BoBIconic** : Lance l'application sur le port 8100

### `stop-all.bat` - Arrêt Complet

#### Fonctionnalités
- ✅ **Arrêt propre** des processus sur les ports spécifiques
- ✅ **Fermeture des fenêtres** de commande
- ✅ **Messages de confirmation** pour chaque service
- ✅ **Gestion des erreurs** si les services ne sont pas en cours

#### Utilisation
```bash
# Double-clic sur le fichier ou
stop-all.bat
```

#### Processus d'Arrêt
1. **Arrêt OpenSky** : Termine le processus sur le port 3000
2. **Arrêt FR24** : Termine le processus sur le port 5001
3. **Arrêt BoBIconic** : Termine le processus sur le port 8100
4. **Fermeture fenêtres** : Ferme les fenêtres de commande spécifiques

## 🛠️ Démarrage Manuel

Si vous préférez démarrer les services manuellement :

### 1. Terminal 1 - OpenSky Proxy
```bash
cd C:\AndroidProjects\BoBIconic
node server.js
```

### 2. Terminal 2 - FR24 Server
```bash
cd C:\AndroidProjects\BoBIconic
python fr24_server.py
```

### 3. Terminal 3 - BoBIconic App
```bash
cd C:\AndroidProjects\BoBIconic
npm start
```

## 📊 Vérification des Services

### Vérification des Ports
```bash
# Vérifier que tous les ports sont en écoute
netstat -an | findstr ":3000\|:5001\|:8100"
```

### Test des Services
- **OpenSky** : http://localhost:3000/api/opensky/states/all
- **FR24** : http://localhost:5001/api/metar/CDG
- **BoBIconic** : http://localhost:8100

## 🔍 Dépannage

### Erreurs Courantes

#### Node.js non trouvé
```
[ERREUR] Node.js n'est pas installé ou n'est pas dans le PATH
```
**Solution** : Installer Node.js depuis https://nodejs.org/

#### Python non trouvé
```
[ERREUR] Python n'est pas installé ou n'est pas dans le PATH
```
**Solution** : Installer Python depuis https://python.org/

#### Port déjà utilisé
```
Error: Port 8100 is already in use
```
**Solution** : Utiliser `stop-all.bat` puis relancer `start-all.bat`

#### Dépendances Python manquantes
```
ModuleNotFoundError: No module named 'flask'
```
**Solution** : Le script installe automatiquement les dépendances

### Logs et Debug

#### Logs OpenSky
- **Fichier** : Terminal "OpenSky Proxy"
- **Format** : `[PROXY] Entrant: GET /api/opensky/states/all`

#### Logs FR24
- **Fichier** : Terminal "FR24 Server"
- **Format** : `127.0.0.1 - - [date] "GET /api/metar/CDG"`

#### Logs BoBIconic
- **Fichier** : Terminal "BoBIconic App"
- **Format** : `[INFO] Development server running!`

## 🔧 Configuration

### Variables d'Environnement

#### OpenSky (server.js)
```javascript
const OPENSKY_CLIENT_ID = 'contact@sunshine-adventures.net-api-client';
const OPENSKY_CLIENT_SECRET = 'TcmsDEEKWgDFfrrcGId4S1Ze8qLy35lL';
```

#### FR24 (fr24_server.py)
```python
AVWX_TOKEN = "pCJJlVSPAHzmrS-1kdizPeQ-MRBGfCLRdPJ-8xB_plw"
```

### Ports Configurables

#### Modification des Ports
- **OpenSky** : Modifier `app.listen(3000, ...)` dans `server.js`
- **FR24** : Modifier `app.run(host='0.0.0.0', port=5001)` dans `fr24_server.py`
- **BoBIconic** : Modifier `--port=8100` dans `package.json`

## 📈 Monitoring

### Interface d'Administration
- **URL** : http://localhost:8100/admin
- **Fonctionnalités** :
  - 📊 Métriques en temps réel
  - 📋 Consultation des logs
  - 🚨 Alertes système
  - 🛠️ Actions administratives

### Logs Centralisés
- **URL** : http://localhost:8100/admin/logs
- **Fonctionnalités** :
  - 🔍 Filtres avancés
  - 📄 Pagination
  - 💾 Export JSON/CSV
  - 📊 Statistiques détaillées

## 🚀 Optimisations

### Performance
- **Hot Reload** : Les modifications de code rechargent automatiquement
- **Cache** : Les dépendances sont mises en cache
- **Compression** : Les assets sont compressés en production

### Sécurité
- **CORS** : Configuration appropriée pour les requêtes cross-origin
- **OAuth2** : Authentification sécurisée pour OpenSky
- **Validation** : Validation des entrées utilisateur

## 📝 Bonnes Pratiques

### Démarrage
1. **Utiliser start-all.bat** pour un démarrage automatique
2. **Vérifier les logs** dans chaque terminal
3. **Tester les services** avant utilisation

### Arrêt
1. **Utiliser stop-all.bat** pour un arrêt propre
2. **Attendre la confirmation** de chaque service
3. **Vérifier les ports** si nécessaire

### Maintenance
1. **Mettre à jour les dépendances** régulièrement
2. **Vérifier les logs** pour détecter les problèmes
3. **Sauvegarder la configuration** avant modifications

## 🎯 Conclusion

Les scripts `start-all.bat` et `stop-all.bat` simplifient considérablement la gestion des services BoBIconic en :

- ✅ **Automatisant** le démarrage et l'arrêt
- ✅ **Vérifiant** les prérequis automatiquement
- ✅ **Gérant** les erreurs de manière informative
- ✅ **Fournissant** une interface utilisateur claire
- ✅ **Assurant** un fonctionnement fiable

Ces scripts transforment BoBIconic en une application facile à déployer et à maintenir. 