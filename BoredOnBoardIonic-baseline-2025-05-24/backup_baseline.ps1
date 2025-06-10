# backup_baseline.ps1
# Script de backup baseline pour PowerShell
# 1. Réinitialise le dépôt git local et force le push sur GitLab (écrase tout l'historique)
# 2. Crée une archive zip de la baseline (hors node_modules, dist, .git, etc.)
# Usage : .\backup_baseline.ps1

$ErrorActionPreference = 'Stop'

# Force l'encodage UTF-8 pour l'affichage correct des accents
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$REMOTE_URL = "https://gitlab.com/DarioMangano/bob_backend_prod_perso.git"
$ARCHIVE_NAME = "../BoredOnBoardIonic-baseline-$(Get-Date -Format 'yyyy-MM-dd').zip"
$LOG_FILE = "backup_baseline.log"

# Démarre la capture du log
Start-Transcript -Path $LOG_FILE -Force

Write-Host "---------------------------------------------"
Write-Host "SCRIPT DE BACKUP BASELINE (PowerShell)"
Write-Host "---------------------------------------------"
Write-Host "Remote GitLab : $REMOTE_URL"
Write-Host "Archive       : $ARCHIVE_NAME"
Write-Host "Log           : $LOG_FILE"
Write-Host

$confirm = Read-Host "⚠️  Ce script va ÉCRASER l'historique GitLab et créer une archive zip. Continuer ? (y/N) "
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Abandon."
    Stop-Transcript
    exit 1
}

Write-Host
Write-Host "1️⃣  Réinitialisation du dépôt git local..."
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
& git init
Write-Host "   → Dépôt git initialisé."
& git add .
Write-Host "   → Fichiers ajoutés."
& git commit -m "Baseline clean du projet - $(Get-Date -Format 'yyyy-MM-dd')"
Write-Host "   → Commit baseline effectué."
try { & git remote remove origin } catch {}
& git remote add origin $REMOTE_URL
& git branch -M main
Write-Host "   → Remote et branche configurés."
Write-Host "   → Push en cours (cela peut prendre du temps)..."
& git push --force origin main
Write-Host "✅ Dépôt GitLab mis à jour avec la baseline."

Write-Host
Write-Host "2️⃣  Création de l'archive zip..."
if (Test-Path $ARCHIVE_NAME) { Remove-Item $ARCHIVE_NAME }

# Exclure node_modules, dist, .git, *.zip, backup_baseline.log manuellement
$exclude = @("node_modules", "dist", ".git", "*.zip", "backup_baseline.log")
$items = Get-ChildItem -Recurse -File | Where-Object {
    $path = $_.FullName.Replace($PWD.Path + "\", "")
    foreach ($ex in $exclude) {
        if ($ex -eq "*.zip" -and $path -like "*.zip") { return $false }
        if ($path -eq "backup_baseline.log") { return $false }
        if ($path -like "$ex*" -or $path -like "*\$ex*" -or $path -like "*\$ex\\*") { return $false }
    }
    return $true
}
$itemsToZip = $items | ForEach-Object { $_.FullName }
Compress-Archive -Path $itemsToZip -DestinationPath $ARCHIVE_NAME -CompressionLevel Optimal -Force
Write-Host "✅ Archive créée : $ARCHIVE_NAME"

Write-Host
Write-Host "---------------------------------------------"
Write-Host "🎉 Backup baseline terminé avec succès."
Write-Host "---------------------------------------------"

Stop-Transcript
Write-Host "(Voir le log détaillé dans $LOG_FILE)" 