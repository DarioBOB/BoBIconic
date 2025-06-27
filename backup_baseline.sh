#!/bin/bash
# backup_baseline.sh
# Archive le projet (hors node_modules, dist, .git, etc.) pour backup CI/CD

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d-%H%M%S)
ARCHIVE_NAME="$BACKUP_DIR/BoBIconic-backup-$DATE.zip"

mkdir -p "$BACKUP_DIR"

echo "Création de l'archive zip : $ARCHIVE_NAME"
zip -r "$ARCHIVE_NAME" . -x "node_modules/*" -x "dist/*" -x ".git/*" -x "*.zip" -x "backups/*"

echo "✅ Archive créée : $ARCHIVE_NAME" 