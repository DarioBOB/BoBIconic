# backup_baseline.ps1
# Script de backup baseline pour PowerShell
# CONSEIL : Enregistrez ce fichier en UTF-8 (sans BOM) pour éviter les problèmes d'encodage.
# Ce script utilise la branche 'main' car c'est la branche par défaut sur GitLab pour ce projet.
# 1. Reinitialise le depot git local et force le push sur GitLab (ecrase tout l'historique)
# 2. Cree une archive zip de la baseline (hors node_modules, dist, .git, etc.)
# Usage : .\backup_baseline.ps1

$ErrorActionPreference = 'Stop'

# Force l'encodage UTF-8 pour l'affichage correct
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$REMOTE_URL = "https://gitlab.com/DarioMangano/bob_backend_prod_perso.git"
$GITHUB_URL = "https://github.com/DarioBOB/BoBIconic.git"
$GITHUB_USER = "DarioBOB"
$GITHUB_TOKEN_FILE = "github_token.txt"
$BACKUP_DIR = "../backups"
$DATE = Get-Date -Format 'yyyy-MM-dd_HH-mm'
$LOG_FILE = "backup_baseline.log"
$ENABLE_LOG = $false  # Passe a $true pour activer le log
$ENABLE_GIT_PUSH = $true  # Push GitLab activé

# Chemin vers l'exécutable 7-Zip
$SevenZipPath = "C:\Program Files\7-Zip\7z.exe"
if (!(Test-Path $SevenZipPath)) {
    Write-Host "Erreur : 7-Zip n'est pas installé à l'emplacement $SevenZipPath" -ForegroundColor Red
    exit 1
}

# Cree le dossier backup AVANT de changer de dossier
if (!(Test-Path $BACKUP_DIR)) { New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null }
$BACKUP_DIR_ABS = Resolve-Path $BACKUP_DIR
$ARCHIVE_NAME = Join-Path $BACKUP_DIR_ABS "BoredOnBoardIonic-baseline-$DATE.zip"

# Gestion sécurisée du token GitLab dans un fichier séparé
$defaultTokenFile = "gitlab_token.txt"
$tokenFile = Join-Path $PSScriptRoot $defaultTokenFile

# Gestion sécurisée du token GitHub dans un fichier séparé
$githubTokenFile = Join-Path $PSScriptRoot $GITHUB_TOKEN_FILE

function Get-GitlabToken {
    if (Test-Path $tokenFile) {
        $token = Get-Content $tokenFile -Raw
        $token = $token.Trim()
    } else {
        $token = Read-Host "Entrez votre Personal Access Token GitLab (PAT) :"
        Set-Content -Path $tokenFile -Value $token
    }
    return $token
}

function Get-GithubToken {
    if (Test-Path $githubTokenFile) {
        $token = Get-Content $githubTokenFile -Raw
        $token = $token.Trim()
    } else {
        $token = Read-Host "Entrez votre GitHub Personal Access Token (PAT) :"
        Set-Content -Path $githubTokenFile -Value $token
    }
    return $token
}

function Check-GitlabToken($token, $username, $remoteUrl) {
    $testUrl = "https://" + $username + ":" + $token + "@gitlab.com/DarioMangano/bob_backend_prod_perso.git"
    try {
        git ls-remote $testUrl >$null 2>$null
        return $true
    } catch {
        return $false
    }
}

if ($ENABLE_LOG) {
    Start-Transcript -Path $LOG_FILE -Force
}

Write-Host "---------------------------------------------"
Write-Host "SCRIPT DE BACKUP BASELINE (PowerShell)"
Write-Host "---------------------------------------------"
Write-Host "Remote GitLab : $REMOTE_URL"
Write-Host "Remote GitHub : $GITHUB_URL"
Write-Host "Archive       : $ARCHIVE_NAME"
Write-Host "Log           : $LOG_FILE"
Write-Host

$confirm = Read-Host "ATTENTION : Ce script va ECRASER l'historique GitLab et creer une archive zip. Continuer ? (y/N) "
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Abandon."
    if ($ENABLE_LOG) { Stop-Transcript }
    exit 1
}

Write-Host
Write-Host "[1] Reinitialisation du depot git local..."
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
& git init
Write-Host "   [OK] Depot git initialise."
& git add .
Write-Host "   [OK] Fichiers ajoutes."
& git commit -m "Baseline clean du projet - $DATE"
Write-Host "   [OK] Commit baseline effectue."
try { & git remote remove origin 2>$null } catch {}

# Juste avant la config du remote :
$username = "DarioMangano"  # à adapter si besoin
$token = Get-GitlabToken
$tokenValid = Check-GitlabToken $token $username $REMOTE_URL
while (-not $tokenValid) {
    Write-Host "[ERREUR] Le token GitLab n'est plus valide ou a expiré."
    $token = Read-Host "Veuillez saisir un nouveau Personal Access Token GitLab (PAT) :"
    Set-Content -Path $tokenFile -Value $token
    $tokenValid = Check-GitlabToken $token $username $REMOTE_URL
}
$REMOTE_URL = "https://${username}:${token}@gitlab.com/DarioMangano/bob_backend_prod_perso.git"
try { & git remote remove origin 2>$null } catch {}
& git remote add origin $REMOTE_URL
& git branch -M main
Write-Host "   [OK] Remote et branche 'main' configures."

# --- Ajout remote GitHub ---
$githubToken = Get-GithubToken
$GITHUB_REMOTE_URL = "https://${GITHUB_USER}:${githubToken}@github.com/DarioBOB/BoBIconic.git"
try { & git remote remove github 2>$null } catch {}
& git remote add github $GITHUB_REMOTE_URL

if ($ENABLE_GIT_PUSH) {
    Write-Host "   [INFO] Push en cours (cela peut prendre du temps)..."
    try {
        & git push --force origin main
        Write-Host "[OK] Dépôt GitLab mis à jour avec la baseline (branche main)."
    } catch {
        Write-Host "[WARN] Erreur lors du git push --force (GitLab)."
    }
    try {
        & git push --force github main
        Write-Host "[OK] Dépôt GitHub mis à jour avec la baseline (branche main)."
    } catch {
        Write-Host "[WARN] Erreur lors du git push --force (GitHub)."
    }
} else {
    Write-Host "[INFO] Push Git désactivé, seul le backup zip sera créé."
}

Write-Host
Write-Host "[2] Creation de l'archive zip avec 7-Zip..."

# Sauvegarde le chemin absolu du projet avant de changer de dossier
$projectRoot = $PWD.Path

# Définir les motifs d'exclusion pour 7-Zip
$excludePatterns = @(
    "node_modules",
    "dist",
    ".git",
    "*.zip",
    "backup_baseline.log",
    "backups"
)

# Générer les arguments d'exclusion pour 7-Zip
$excludeArgs = $excludePatterns | ForEach-Object { "-xr!$_" }

# Construire la liste complète des arguments pour 7-Zip
$sevenZipArgs = @("a", "-tzip", $ARCHIVE_NAME, "*") + $excludeArgs

Write-Host "[INFO] Création de l'archive avec les exclusions suivantes :"
$excludePatterns | ForEach-Object { Write-Host "  - $_" }

# Exécuter 7-Zip avec les arguments construits
Write-Host "[INFO] Exécution de 7-Zip..."
& $SevenZipPath @sevenZipArgs | ForEach-Object { Write-Host $_ }

Write-Host "[OK] Archive créée : $ARCHIVE_NAME"

Write-Host
Write-Host "---------------------------------------------"
Write-Host "[OK] Backup baseline terminé avec succès."
Write-Host "---------------------------------------------"

if ($ENABLE_GIT_PUSH) {
    Write-Host "[OK] Push Git effectué avec succès sur les deux remotes."
}

if ($ENABLE_LOG) {
    Stop-Transcript
    Write-Host "(Voir le log détaillé dans $LOG_FILE)"
}

# Retourner dans le répertoire initial
Set-Location $projectRoot
Write-Host "[OK] Retour dans le répertoire initial : $projectRoot" 