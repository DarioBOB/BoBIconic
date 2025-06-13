#!/bin/bash
# restore_baseline.sh
# Script de restauration du backup baseline
# Usage : ./restore_baseline.sh [archive.zip]

set -e

if [ -z "$1" ]; then
  # Cherche le dernier backup dans ../backups
  ARCHIVE=$(ls -1t ../backups/*.zip 2>/dev/null | head -n 1)
  if [ -z "$ARCHIVE" ]; then
    echo "Aucune archive de backup trouvée dans ../backups/."
    exit 1
  fi
  echo "Aucun argument fourni. Dernier backup trouvé : $ARCHIVE"
else
  ARCHIVE="$1"
fi

if [ ! -f "$ARCHIVE" ]; then
  echo "Archive $ARCHIVE introuvable."
  exit 1
fi

echo "---------------------------------------------"
echo "SCRIPT DE RESTAURATION BASELINE"
echo "---------------------------------------------"
echo "Archive : $ARCHIVE"
echo

read -p "⚠️  Ce script va ÉCRASER les fichiers existants du projet avec ceux du backup. Continuer ? (y/N) " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Abandon."
  exit 1
fi

unzip -o "$ARCHIVE" -d ..
echo "✅ Restauration terminée."
echo "---------------------------------------------" 