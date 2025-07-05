# start-all.ps1
# Lancement de tous les services BoBIconic (PID tracking pour arrêt propre)

# Définir le répertoire de travail absolu
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Chemin personnalisé d'Opera (à adapter si besoin)
$operaPath = "C:\Users\d_man\AppData\Local\Programs\Opera\opera.exe"

Write-Host "[BoBIconic] Répertoire de travail: $scriptDir"
Write-Host "[BoBIconic] Nettoyage du dossier logs..."

# Nettoyage du dossier logs (ignore les fichiers verrouillés)
if (Test-Path .\logs) {
    Get-ChildItem .\logs | ForEach-Object {
        try { Remove-Item $_.FullName -Force }
        catch { Write-Warning "Impossible de supprimer $($_.FullName): $($_.Exception.Message)" }
    }
} else {
    New-Item -ItemType Directory -Path .\logs | Out-Null
}

# Fichier de tracking des PID
$pidsFile = "logs/pids.txt"
if (Test-Path $pidsFile) { Remove-Item $pidsFile }

function Track-Process($proc, $name) {
    Add-Content -Path $pidsFile -Value ("$($proc.Id):$name")
}

# 1. Proxy de logs
Write-Host "[BoBIconic] Démarrage du proxy de logs (node log-proxy.js)..."
$p = Start-Process powershell -ArgumentList '-NoExit','-Command','node log-proxy.js' -WindowStyle Minimized -PassThru -WorkingDirectory $scriptDir
if ($p) { Track-Process $p "log-proxy" } else { Write-Warning "Échec du lancement du proxy de logs" }

# 2. Serveur FR24
Write-Host "[BoBIconic] Démarrage du serveur FR24 (python fr24_server.py)..."
$p = Start-Process cmd.exe -ArgumentList '/c','python fr24_server.py > logs\fr24.log 2>&1' -WindowStyle Minimized -PassThru -WorkingDirectory $scriptDir
if ($p) { Track-Process $p "fr24" } else { Write-Warning "Échec du lancement du serveur FR24" }

# 3. Application Ionic
Write-Host "[BoBIconic] Démarrage de l'application Ionic (start-with-logs.bat)..."
$p = Start-Process powershell -ArgumentList '-NoExit','-Command','./start-with-logs.bat' -WindowStyle Minimized -PassThru -WorkingDirectory $scriptDir
if ($p) { Track-Process $p "ionic" } else { Write-Warning "Échec du lancement de l'application Ionic" }

# 4. Opera en remote-debugging
Write-Host "[BoBIconic] Lancement d'Opera en mode remote debugging (port 9222) et ouverture de l'application..."
$p = Start-Process $operaPath -ArgumentList '--remote-debugging-port=9222','--user-data-dir=%TEMP%/opera-debug','http://localhost:8100/' -WindowStyle Normal -PassThru
if ($p) { Track-Process $p "opera" } else { Write-Warning "Échec du lancement d'Opera ($operaPath)" }

# 5. Capture logs navigateur (désactivée)
# Write-Host "[BoBIconic] Démarrage de la capture des logs navigateur (logs/console.log)..."
# $p = Start-Process powershell -ArgumentList '-NoExit','-Command','node capture-logs.js' -WindowStyle Minimized -PassThru -WorkingDirectory $scriptDir
# if ($p) { Track-Process $p "capture-logs" } else { Write-Warning "Échec du lancement de la capture des logs navigateur" }

Write-Host "[BoBIconic] Tous les services sont lancés. Les PID sont dans logs/pids.txt."

# Option interactive : attendre l'appui sur Entrée pour tout arrêter
Write-Host "[BoBIconic] Appuyez sur Entrée pour arrêter tous les services..."
[void][System.Console]::ReadLine()
Write-Host "[BoBIconic] Arrêt automatique de tous les services (stop-all.ps1)..."
powershell -ExecutionPolicy Bypass -File .\stop-all.ps1 