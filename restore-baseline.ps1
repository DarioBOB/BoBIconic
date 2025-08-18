<#
.SYNOPSIS
    Script PowerShell pour restaurer les fichiers “baseline” (3 onglets) à partir d'une archive ZIP
    et supprimer les fichiers/modules de la migration “tabs” qui posent problème.

.DESCRIPTION
    - Extrait de l’archive ZIP uniquement les fichiers nécessaires (window.page.*, window-map-test.component.*, window-hublot.component.*, landing-tiles.*).
    - Écrase les fichiers existants dans le projet avec ceux extraits.
    - Supprime tous les fichiers relatifs à la nouvelle structure “window-tabs”, “window-text-data”, “window-map-page” et “window-hublot-page”.
    - Met à jour le routing pour pointer vers WindowPage sans children.

.PARAMETER ProjectDir
    Chemin absolu vers ton projet Ionic (ex : C:\AndroidProjects\BoBIconicNew).

.PARAMETER BaselineZip
    Chemin absolu vers l’archive ZIP de la baseline fonctionnelle (ex : C:\AndroidProjects\Backups\BoredOnBoardIonic-baseline-2025-06-03.zip).

.EXAMPLE
    # Exemple d’utilisation depuis PowerShell (en mode Administrateur si possible) :
    C:\> cd C:\AndroidProjects\BoBIconicNew
    C:\AndroidProjects\BoBIconicNew> .\restore-baseline.ps1 -ProjectDir . -BaselineZip "C:\AndroidProjects\Backups\BoredOnBoardIonic-baseline-2025-06-03.zip"

.NOTES
    - Vérifie bien que le chemin du ZIP et celui du projet soient corrects avant d’exécuter.
    - Le script crée un dossier temporaire “.baseline_temp” sous le projet pour extraire l’archive. Il est supprimé ensuite.
    - Assure-toi que Visual Studio Code ou tout autre éditeur ne bloque pas l’écriture des fichiers (ferme l’IDE si besoin).

#>

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectDir,

    [Parameter(Mandatory=$true)]
    [string]$BaselineZip
)

# Activer des erreurs en cas de problème
$ErrorActionPreference = "Stop"

# Résoudre les chemins absolus
$ProjectDir    = (Resolve-Path $ProjectDir).Path.TrimEnd('\')
$BaselineZip   = (Resolve-Path $BaselineZip).Path

# Vérifier que le projet existe
if (!(Test-Path $ProjectDir -PathType Container)) {
    Write-Error "Le dossier projet '$ProjectDir' n'existe pas."
    exit 1
}

# Vérifier que le ZIP existe
if (!(Test-Path $BaselineZip -PathType Leaf)) {
    Write-Error "L’archive ZIP baseline '$BaselineZip' n’existe pas."
    exit 1
}

# Dossier temporaire pour extraire la baseline
$TempDir = Join-Path $ProjectDir ".baseline_temp"

# Si le dossier .baseline_temp existe déjà, le supprimer d’abord
if (Test-Path $TempDir) {
    Write-Host "Suppression du dossier temporaire existant : $TempDir"
    Remove-Item -Recurse -Force $TempDir
}

# Créer le dossier temporaire
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Extraire l’archive ZIP dans le dossier temporaire
Write-Host "Extraction de l’archive baseline dans $TempDir …"
Expand-Archive -LiteralPath $BaselineZip -DestinationPath $TempDir

# On suppose que l’archive contient un sous-dossier racine
$dossierExtrait = Get-ChildItem -Path $TempDir | Where-Object { $_.PSIsContainer } | Select-Object -First 1
if ($null -eq $dossierExtrait) {
    Write-Error "Impossible de trouver le dossier extrait sous $TempDir."
    exit 1
}
$BaselineRoot = $dossierExtrait.FullName

Write-Host "Dossier racine extrait : $BaselineRoot"

# === 1. FICHIERS À RESTAURER ===

# Liste des fichiers à copier depuis la baseline vers le projet (relatifs à $BaselineRoot)
$filesToRestore = @(
    # Pages "window.page"
    "src\app\pages\window.page.ts",
    "src\app\pages\window.page.html",
    "src\app\pages\window.page.scss",

    # Composant carte (Leaflet) et composant hublot (si présent)
    "src\app\components\window-map-test.component.ts",
    "src\app\components\window-hublot.component.ts",

    # Landing Tiles (restaure la tuile Ma Fenêtre)
    "src\app\pages\landing-tiles\landing-tiles.page.ts",
    "src\app\pages\landing-tiles\landing-tiles.page.html",
    "src\app\pages\landing-tiles\landing-tiles.page.scss"
)

foreach ($relativePath in $filesToRestore) {
    $sourcePath = Join-Path $BaselineRoot $relativePath
    $destPath   = Join-Path $ProjectDir  $relativePath

    if (Test-Path $sourcePath) {
        # Créer le dossier parent dans le projet si nécessaire
        $parentFolder = Split-Path $destPath -Parent
        if (!(Test-Path $parentFolder)) {
            New-Item -ItemType Directory -Path $parentFolder -Force | Out-Null
        }

        Write-Host "Restaurer : $relativePath"
        Copy-Item -Force -Path $sourcePath -Destination $destPath
    }
    else {
        Write-Warning "Fichier manquant dans la baseline : $relativePath"
    }
}

# === 2. FICHIERS À SUPPRIMER ===

$patternsToRemove = @(
    "src\app\pages\window-tabs*",
    "src\app\pages\window-text-data*",
    "src\app\pages\window-map.page*",
    "src\app\pages\window-hublot.page*",
    "src\app\pages\window.module.ts",
    "src\app\pages\window-text-data-routing.module.ts",
    "src\app\pages\window-map-routing.module.ts",
    "src\app\pages\window-hublot-routing.module.ts"
)

foreach ($pattern in $patternsToRemove) {
    $fullPattern = Join-Path $ProjectDir $pattern
    $items = Get-ChildItem -Path $fullPattern -Recurse -Force -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        if ($item.PSIsContainer) {
            Write-Host "Suppression du dossier : $($item.FullName)"
            Remove-Item -Recurse -Force $item.FullName
        }
        else {
            Write-Host "Suppression du fichier : $($item.FullName)"
            Remove-Item -Force $item.FullName
        }
    }
}

# === 3. METTRE À JOUR LE ROUTING (app-routing.module.ts) ===

$appRouting = Join-Path $ProjectDir "src\app\app-routing.module.ts"

if (Test-Path $appRouting) {
    Write-Host "Mise à jour du routing dans app-routing.module.ts"

    $content = Get-Content $appRouting -Raw

    # Remplacer toute occurrence de WindowTabsPage/children par WindowPage
    # On utilise une regex plus souple pour capturer tout bloc 'path: "window", component: WindowTabsPage {...}'.
    $pattern2 = "(?s)\{\s*path:\s*'window'\s*,\s*component:\s*WindowTabsPage.*?\}"
    $replacement = "{`n    path: 'window',`n    component: WindowPage`n  }"

    if ($content -match "WindowTabsPage") {
        $newContent = [regex]::Replace($content, $pattern2, $replacement)
        Set-Content -Path $appRouting -Value $newContent -Force
        Write-Host "Bloc 'window' remplacé par pointage vers WindowPage."
    }
    else {
        Write-Host "Aucun bloc WindowTabsPage trouvé dans app-routing.module.ts ; rien à remplacer."
    }
}
else {
    Write-Warning "Fichier 'app-routing.module.ts' introuvable : $appRouting"
}

# === 4. NETTOYAGE DU DOSSIER TEMPORAIRE ===
if (Test-Path $TempDir) {
    Write-Host "Suppression du dossier temporaire : $TempDir"
    Remove-Item -Recurse -Force $TempDir
}

Write-Host "`n=== Restauration terminée ==="
Write-Host "Vérifie que les fichiers window.page.* et landing-tiles.* ont bien été restaurés,"
Write-Host "que tous les fichiers window-tabs*, window-text-data*, window-map.page*, window-hublot.page* ont disparu,"
Write-Host "et relance `ionic serve` pour confirmer que tout compile à nouveau."
