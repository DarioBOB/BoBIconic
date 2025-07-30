# stop-all.ps1
# Arrêt propre de tous les services BoBIconic lancés par start-all.ps1

$pidsFile = "logs/pids.txt"

if (!(Test-Path $pidsFile)) {
    Write-Host "[BoBIconic] Aucun fichier de PID trouvé (logs/pids.txt). Rien à arrêter."
    exit 0
}

Write-Host "[BoBIconic] Arrêt de tous les services listés dans logs/pids.txt..."

Get-Content $pidsFile | ForEach-Object {
    $parts = $_ -split ':'
    $procId = $parts[0]
    $name = $parts[1]
    try {
        Write-Host "Arrêt de $name (PID: $procId)..."
        & taskkill /PID $procId /T /F | Out-Null
    } catch {
        Write-Warning "Échec lors de l'arrêt du PID $procId ($name)"
    }
}

Remove-Item $pidsFile
Write-Host "[BoBIconic] Tous les processus ont été arrêtés et logs/pids.txt supprimé."

# --- AJOUT : Tuer tous les node.exe, esbuild.exe et python.exe restants liés au projet ---
Write-Host "[BoBIconic] Recherche et terminaison des processus node, esbuild, python liés à BoBIconic..."
Get-Process node,esbuild,python -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -and ($_.Path -like "*BoBIconic*")
} | ForEach-Object {
    try {
        Write-Host "Forcibly killing $($_.ProcessName) (PID: $($_.Id))..."
        Stop-Process -Id $_.Id -Force
    } catch {
        Write-Warning "Impossible de tuer $($_.ProcessName) ($($_.Id)): $($_.Exception.Message)"
    }
}
Write-Host "[BoBIconic] Nettoyage des processus orphelins terminé." 