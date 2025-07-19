#!/bin/bash

echo "========================================"
echo "BoBIconic - Lancement avec capture logs"
echo "========================================"
echo

# Créer le dossier logs s'il n'existe pas
mkdir -p logs

# Nettoyer l'ancien fichier de log
rm -f logs/app.log

echo "[$(date)] Démarrage de l'application BoBIconic..."
echo "[$(date)] Démarrage de l'application BoBIconic..." >> logs/app.log

echo
echo "Lancement de ng serve avec capture des logs..."
echo "Les logs sont sauvegardés dans logs/app.log"
echo "Appuyez sur Ctrl+C pour arrêter"
echo

# Lancer ng serve et capturer tous les logs
ng serve --host=localhost --port=8100 --disable-host-check 2>&1 | tee logs/app.log

echo
echo "[$(date)] Arrêt de l'application BoBIconic"
echo "[$(date)] Arrêt de l'application BoBIconic" >> logs/app.log 