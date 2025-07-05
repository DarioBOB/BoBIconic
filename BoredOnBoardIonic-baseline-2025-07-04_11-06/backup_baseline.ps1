<#
.SYNOPSIS
  Script de backup baseline (PowerShell) utilisant 7‑Zip comme auparavant, sans saisie manuelle de PAT
#>

param(
    [string]$ProjectRoot = (Get-Location).Path,
    [string]$BackupDir   = "C:\AndroidProjects\Backups",
    [switch]$DisablePush
)

# Sauvegarde le chemin absolu du projet avant de changer de dossier
$projectRoot = $ProjectRoot

# Horodatage et chemins
$timestamp   = Get-Date -Format "yyyy-MM-dd_HH-mm"
$ArchiveName = "BoredOnBoardIonic-baseline-$timestamp.zip"
$ArchivePath = Join-Path $BackupDir $ArchiveName
$LogFile     = Join-Path $ProjectRoot "backup_baseline.log"

# URL HTTPS “propres” (sans PAT)
$GitLabRemote = "https://gitlab.com/DarioMangano/bob_backend_prod_perso.git"
$GitHubRemote = "https://github.com/DarioBOB/BoBIconic.git"

# Crée le dossier backups s’il n’existe pas
if (!(Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir | Out-Null }

Write-Host "---------------------------------------------"
Write-Host "SCRIPT DE BACKUP BASELINE (PowerShell)"
Write-Host "---------------------------------------------"
Write-Host "Remote GitLab : $GitLabRemote"
Write-Host "Remote GitHub : $GitHubRemote"
Write-Host "Archive       : $ArchivePath"
Write-Host "Log           : $LogFile"
Write-Host ""

$userChoice = Read-Host "ATTENTION : Ce script va ECRASER l'historique GitLab et créer une archive zip. Continuer ? (y/N)"
if ($userChoice -ne 'y') { Write-Host "Abandon..."; exit 1 }

# 1. Réinitialisation du dépôt local
Write-Host "`n[1] Réinitialisation du dépôt git local..."
if (Test-Path "$ProjectRoot\.git") { Remove-Item -Recurse -Force "$ProjectRoot\.git" }
& git init | Out-Null
Write-Host "   [OK] Dépôt git initialisé."

# 2. Ajout de tous les fichiers
Write-Host "`n[2] Ajout des fichiers..."
& git add .
Write-Host "   [OK] Fichiers ajoutés."

# 3. Commit baseline
Write-Host "`n[3] Commit baseline..."
& git commit -m "Baseline clean du projet - $timestamp"
Write-Host "   [OK] Commit baseline effectué."

# 4. Nettoyage de l'historique (suppression des tokens)
Write-Host "`n[4] Nettoyage des tokens dans l'historique..."
$env:FILTER_BRANCH_SQUELCH_WARNING = "1"
& git filter-branch --force --index-filter `
    "git rm --cached --ignore-unmatch github_token.txt gitlab_token.txt" `
    --prune-empty --tag-name-filter cat -- --all
Write-Host "   [OK] Historique nettoyé."

# 5. Configuration des remotes HTTPS
Write-Host "`n[5] Configuration des remotes (HTTPS sans PAT)..."
& git remote remove origin 2>$null; & git remote add origin $GitLabRemote
Write-Host "   [OK] Remote 'origin' configuré."
& git remote remove github 2>$null; & git remote add github $GitHubRemote
Write-Host "   [OK] Remote 'github' configuré."

# 6. Push vers GitLab et GitHub
if (-not $DisablePush) {
    Write-Host "`n[6] Push des changements vers GitLab et GitHub..."
    & git branch -M main
    & git push --force origin main
    & git push --force github main
    Write-Host "   [OK] Push Git effectué sur les deux remotes."
} else {
    Write-Host "   [INFO] Push désactivé (--DisablePush)."
}

# 7. Création de l'archive ZIP
Write-Host "`n[7] Création de l'archive ZIP..."

# Sauvegarde le chemin avant de zipper
Push-Location $ProjectRoot

# Définir les motifs d'exclusion pour 7-Zip
$excludePatterns = @(
    "node_modules",
    "dist",
    ".git",
    "*.zip",
    "backup_baseline.log",
    "Backups",
    ".angular",
    "github_token.txt",
    "gitlab_token.txt"
)

# Générer les arguments d'exclusion pour 7-Zip
$excludeArgs = $excludePatterns | ForEach-Object { "-xr!$_" }

# Construire la liste complète des arguments pour 7-Zip
$sevenZipArgs = @("a", "-tzip", $ArchivePath, "*") + $excludeArgs

Write-Host "[INFO] Création de l'archive avec les exclusions suivantes :"
$excludePatterns | ForEach-Object { Write-Host "  - $_" }

# Exécuter 7-Zip
$SevenZipPath = (Get-Command 7z.exe -ErrorAction SilentlyContinue).Path
if (-not $SevenZipPath) { $SevenZipPath = "$env:ProgramFiles\7-Zip\7z.exe" }
Write-Host "[INFO] Exécution de 7-Zip : $SevenZipPath"
& $SevenZipPath @sevenZipArgs | ForEach-Object { Write-Host $_ }

Write-Host "[OK] Archive créée : $ArchivePath"

# Revenir au dossier initial
Pop-Location
Write-Host "[OK] Retour dans le répertoire initial : $projectRoot"
