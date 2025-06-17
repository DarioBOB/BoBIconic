#!/bin/bash
# backup_baseline.sh
# Script de backup baseline :
# 1. Réinitialise le dépôt git local et force le push sur GitLab (écrase tout l'historique)
# 2. Crée une archive zip de la baseline (hors node_modules, dist, .git, etc.)
# Usage : ./backup_baseline.sh

set -e

REMOTE_URL="https://gitlab.com/DarioMangano/bob_backend_prod_perso.git"
BACKUP_DIR="../backups"
DATE=$(date +%Y-%m-%d)
ARCHIVE_NAME="$BACKUP_DIR/BoredOnBoardIonic-baseline-$DATE.zip"

mkdir -p "$BACKUP_DIR"

echo "---------------------------------------------"
echo "SCRIPT DE BACKUP BASELINE"
echo "---------------------------------------------"
echo "Remote GitLab : $REMOTE_URL"
echo "Archive       : $ARCHIVE_NAME"
echo

read -p "⚠️  Ce script va ÉCRASER l'historique GitLab et créer une archive zip. Continuer ? (y/N) " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Abandon."
  exit 1
fi

echo
echo "1️⃣  Réinitialisation du dépôt git local..."
rm -rf .git
git init
echo "   → Dépôt git initialisé."
git add .
echo "   → Fichiers ajoutés."
git commit -m "Baseline clean du projet - $DATE"
echo "   → Commit baseline effectué."
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"
git branch -M main
echo "   → Remote et branche configurés."
echo "   → Push en cours (cela peut prendre du temps)..."
git push --force origin main
echo "✅ Dépôt GitLab mis à jour avec la baseline."

echo
echo "2️⃣  Création de l'archive zip..."
cd ..
zip -r "$ARCHIVE_NAME" "$(basename $PWD)" -x "$(basename $PWD)/node_modules/*" -x "$(basename $PWD)/dist/*" -x "$(basename $PWD)/.git/*" -x "$(basename $PWD)/*.zip"
echo "✅ Archive créée : $ARCHIVE_NAME"

cd - > /dev/null

echo
echo "---------------------------------------------"
echo "🎉 Backup baseline terminé avec succès."
echo "---------------------------------------------" 