# Guide de Lancement BoBIconic

## 🚀 Scripts de Lancement

### Script Principal (Recommandé)
**`start-robust.bat`** - Script robuste qui évite les problèmes PowerShell
- ✅ Lance tous les services automatiquement
- ✅ Gère les processus existants
- ✅ Affiche les logs dans des fenêtres séparées
- ✅ Compatible avec tous les environnements Windows

### Scripts Alternatifs
- `start-simple.bat` - Script original (peut avoir des problèmes PowerShell)
- `start-all.bat` - Script hybride avec vérifications (peut geler)
- `start-with-logs.bat` - Lancement avec capture de logs

## 🔧 Diagnostic

### Si les scripts ne fonctionnent pas
**`diagnostic.bat`** - Teste l'environnement et identifie les problèmes
- ✅ Vérifie Node.js et Python
- ✅ Teste les ports utilisés
- ✅ Lance le serveur de logs en mode test

## 📋 Procédure de Lancement

### 1. Premier Lancement
```bash
# Double-cliquer sur
start-robust.bat
```

### 2. Vérification des Services
Après le lancement, tu devrais voir :
- **3 fenêtres ouvertes** avec les titres :
  - "Log Proxy" (serveur de logs)
  - "FR24 Server" (serveur Python)
  - "BoBIconic App" (application Angular)

### 3. Accès aux Services
- **Application principale** : http://localhost:8100
- **Serveur FR24** : http://localhost:5001
- **Serveur de logs** : http://localhost:3030

## 🐛 Résolution de Problèmes

### Problème : "Le script démarre mais ne fait rien"
**Cause** : PowerShell qui gèle sur certaines commandes
**Solution** : Utiliser `start-robust.bat` au lieu des autres scripts

### Problème : Port 8100 non disponible
**Cause** : Port déjà utilisé ou réservé
**Solution** : Angular utilisera automatiquement un port disponible (ex: 51673)

### Problème : Serveur de logs ne démarre pas
**Test manuel** :
```bash
node log-proxy.js
```
Tu devrais voir : "Log proxy listening on http://localhost:3030"

### Problème : PowerShell gèle sur toutes les commandes
**Cause** : Problème d'encodage ou de configuration
**Solution** : 
1. Fermer PowerShell
2. Ouvrir cmd.exe à la place
3. Utiliser les scripts .bat

## 📊 Architecture des Services

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Log Proxy     │    │   FR24 Server   │    │  BoBIconic App  │
│   Port: 3030    │    │   Port: 5001    │    │   Port: 8100    │
│   (Node.js)     │    │   (Python)      │    │   (Angular)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Firestore DB         │
                    │      (Firebase)           │
                    └───────────────────────────┘
```

## 🔄 Cycle de Vie

### Démarrage
1. Arrêt des processus existants
2. Lancement du serveur de logs
3. Lancement du serveur FR24
4. Lancement de l'application Angular

### Arrêt
- **Fermer les fenêtres** des services pour les arrêter
- Ou utiliser `stop-all.bat` pour arrêter tous les processus

## 📝 Logs et Debug

### Logs Visibles
- **Log Proxy** : Logs de l'application via LoggerService
- **FR24 Server** : Logs du serveur Python
- **BoBIconic App** : Logs de compilation Angular

### Fichiers de Logs
- `logs/app.log` - Logs de l'application
- `logs/fr24.log` - Logs du serveur FR24

## 🎯 Scripts par Usage

| Usage | Script | Description |
|-------|--------|-------------|
| **Développement normal** | `start-robust.bat` | Lancement complet et stable |
| **Diagnostic** | `diagnostic.bat` | Test de l'environnement |
| **Debug avancé** | `start-with-logs.bat` | Avec capture de logs |
| **Arrêt** | `stop-all.bat` | Arrêt de tous les services |

## ⚠️ Notes Importantes

1. **Toujours utiliser `start-robust.bat`** en cas de problème
2. **Vérifier les 3 fenêtres** s'ouvrent correctement
3. **Regarder les logs** dans les fenêtres pour diagnostiquer
4. **Si PowerShell gèle**, utiliser cmd.exe à la place

## 🔗 URLs Importantes

- **Application** : http://localhost:8100
- **Admin** : http://localhost:8100/admin
- **Logs Admin** : http://localhost:8100/admin/logs
- **FR24 API** : http://localhost:5001
- **Log Proxy** : http://localhost:3030

---
*Dernière mise à jour : $(Get-Date)* 