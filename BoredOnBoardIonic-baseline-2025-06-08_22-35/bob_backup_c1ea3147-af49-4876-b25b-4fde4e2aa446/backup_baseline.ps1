# backup_baseline.ps1
# Script de backup baseline pour PowerShell
# 1. Réinitialise le dépôt git local et force le push sur GitLab (écrase tout l'historique)
# 2. Crée une archive zip de la baseline (hors node_modules, dist, .git, etc.)
# Usage : .\backup_baseline.ps1

$ErrorActionPreference = 'Stop'

# Force l'encodage UTF-8 pour l'affichage correct des accents
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$REMOTE_URL = "https://gitlab.com/DarioMangano/bob_backend_prod_perso.git"
$BACKUP_DIR = "../backups"
$DATE = Get-Date -Format 'yyyy-MM-dd'
$LOG_FILE = "backup_baseline.log"
$ENABLE_LOG = $false  # Passe à $true pour activer le log
$ENABLE_GIT_PUSH = $false  # Passe à $true pour activer le git push --force

# Crée le dossier backup AVANT de changer de dossier
if (!(Test-Path $BACKUP_DIR)) { New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null }
$BACKUP_DIR_ABS = Resolve-Path $BACKUP_DIR
$ARCHIVE_NAME = Join-Path $BACKUP_DIR_ABS "BoredOnBoardIonic-baseline-$DATE.zip"

if ($ENABLE_LOG) {
  Start-Transcript -Path $LOG_FILE -Force
}

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
    if ($ENABLE_LOG) { Stop-Transcript }
    exit 1
}

Write-Host
Write-Host "1️⃣  Réinitialisation du dépôt git local..."
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
& git init
Write-Host "   → Dépôt git initialisé."
& git add .
Write-Host "   → Fichiers ajoutés."
& git commit -m "Baseline clean du projet - $DATE"
Write-Host "   → Commit baseline effectué."
try { & git remote remove origin } catch {}
& git remote add origin $REMOTE_URL
& git branch -M master
Write-Host "   → Remote et branche configurés."
if ($ENABLE_GIT_PUSH) {
  Write-Host "   → Push en cours (cela peut prendre du temps)..."
  try {
    & git push --force origin master
    Write-Host "✅ Dépôt GitLab mis à jour avec la baseline."
  } catch {
    Write-Host "⚠️  Erreur lors du git push --force (branche protégée ?). Le backup zip sera quand même créé."
  }
} else {
  Write-Host "(Push GitLab désactivé, seul le backup zip sera créé)"
}

Write-Host
Write-Host "2️⃣  Création de l'archive zip..."
Set-Location ..
$projectName = Split-Path -Leaf $PWD.Path
if (Test-Path $ARCHIVE_NAME) { Remove-Item $ARCHIVE_NAME }

# Création d'un dossier temporaire pour le backup
$tempDir = Join-Path $env:TEMP ("bob_backup_" + [System.Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempDir | Out-Null
Copy-Item $projectName\* $tempDir -Recurse -Force

# Exclure node_modules, dist, .git, *.zip, backup_baseline.log du dossier temporaire
$excludes = @("node_modules", "dist", ".git", "*.zip", "backup_baseline.log")
foreach ($exclude in $excludes) {
    Get-ChildItem -Path $tempDir -Recurse -Force -Filter $exclude | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

Compress-Archive -Path $tempDir -DestinationPath $ARCHIVE_NAME -CompressionLevel Optimal -Force
Remove-Item -Recurse -Force $tempDir
Write-Host "✅ Archive créée : $ARCHIVE_NAME"
Set-Location $projectName

Write-Host
Write-Host "---------------------------------------------"
Write-Host "🎉 Backup baseline terminé avec succès."
Write-Host "---------------------------------------------"

if ($ENABLE_LOG) {
  Stop-Transcript
  Write-Host "(Voir le log détaillé dans $LOG_FILE)"
} 