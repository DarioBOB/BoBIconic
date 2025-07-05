# 🚀 Lancement Rapide BoBIconic

## ✅ Script Principal
**Double-cliquer sur : `start-robust.bat`**

## 🔍 Si ça ne marche pas
1. **Diagnostic** : `diagnostic.bat`
2. **Vérifier** : 3 fenêtres doivent s'ouvrir
3. **Accéder** : http://localhost:8100

## 📋 Ce qui doit s'ouvrir
- ✅ **Log Proxy** (port 3030)
- ✅ **FR24 Server** (port 5001) 
- ✅ **BoBIconic App** (port 8100)

## 🐛 Problème PowerShell
Si PowerShell gèle → Utiliser `start-robust.bat` (évite PowerShell)

## 📖 Documentation complète
Voir `LANCEMENT_PROJET.md` pour plus de détails

# Lancement et centralisation des logs BoBIconic

## Lancement automatique

Lancez tous les services et la capture des logs avec :

```
powershell .\start-all.ps1
```

- Démarre Opera en mode remote debugging (port 9222)
- Démarre la capture automatique de tous les logs navigateur dans `logs/console.log`
- Démarre le proxy de logs, le serveur Python FR24, et l'application Ionic
- Centralise tous les logs dans le dossier `logs/`

## Fichiers de log

- `logs/app.log` : logs applicatifs (backend, proxy, LoggerService)
- `logs/fr24.log` : logs du serveur Python FR24
- `logs/console.log` : tous les logs navigateur (console.log, warn, error, etc.) capturés automatiquement

## Arrêt des services

Utilisez :
```
powershell .\stop-all.ps1
```

## Dépannage
- Si un log n'apparaît pas, vérifiez que tous les services sont bien lancés et qu'Opera est en mode remote debugging.
- Pour toute anomalie, consultez les logs dans le dossier `logs/`. 