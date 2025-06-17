# restore_baseline.ps1
# Script de restauration du backup baseline
# Usage : .\restore_baseline.ps1 [archive.zip]

param(
  [string]$Archive
)

if (-not $Archive) {
  $backups = Get-ChildItem -Path ../backups -Filter *.zip | Sort-Object LastWriteTime -Descending
  if ($backups.Count -eq 0) {
    Write-Host "Aucune archive de backup trouvée dans ../backups/."
    exit 1
  }
  $Archive = $backups[0].FullName
  Write-Host "Aucun argument fourni. Dernier backup trouvé : $Archive"
}

if (!(Test-Path $Archive)) {
  Write-Host "Archive $Archive introuvable."
  exit 1
}

Write-Host "---------------------------------------------"
Write-Host "SCRIPT DE RESTAURATION BASELINE (PowerShell)"
Write-Host "---------------------------------------------"
Write-Host "Archive : $Archive"
Write-Host

$confirm = Read-Host "⚠️  Ce script va ÉCRASER les fichiers existants du projet avec ceux du backup. Continuer ? (y/N) "
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Abandon."
    exit 1
}

Expand-Archive -Path $Archive -DestinationPath .. -Force
Write-Host "✅ Restauration terminée."
Write-Host "---------------------------------------------" 