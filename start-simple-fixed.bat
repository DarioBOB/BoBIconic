@echo off
echo ========================================
echo    BoBIconic - Demarrage Simple (Corrige)
echo ========================================
echo.

REM Creer le dossier logs
if not exist "logs" mkdir logs

REM Nettoyer les anciens logs
if exist "logs\app.log" del "logs\app.log"
if exist "logs\fr24.log" del "logs\fr24.log"

echo [INFO] Arret des services existants...
echo.

REM Arreter le serveur FR24 (port 5001)
echo [1/2] Arret du serveur FR24 (port 5001)...
netstat -ano | findstr ":5001" >nul
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5001"') do taskkill /f /pid %%a >nul 2>nul
    echo [OK] Processus FR24 arrete
) else (
    echo [INFO] Aucun processus FR24 trouve sur le port 5001
)

REM Arreter l'application BoBIconic (tous les ports possibles)
echo [2/2] Arret de l'application BoBIconic...
netstat -ano | findstr ":8100\|:4200\|:51673" >nul
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8100\|:4200\|:51673"') do taskkill /f /pid %%a >nul 2>nul
    echo [OK] Processus BoBIconic arrete
) else (
    echo [INFO] Aucun processus BoBIconic trouve
)

REM Attendre un peu pour que les processus se ferment completement
timeout /t 2 /nobreak >nul

echo.
echo [INFO] Demarrage des services...
echo.

REM === Lancer le serveur de logs (log-proxy.js) si besoin ===
echo [DEBUG] Debut test serveur de logs
netstat -ano | findstr ":3030" > logproxy.tmp 2>&1
findstr ":3030" logproxy.tmp >nul 2>&1
if %errorlevel%==0 goto log_running
goto log_not_running
:log_running
echo [INFO] Le serveur de logs (log-proxy.js) est deja lance (port 3030)
del logproxy.tmp >nul 2>&1
goto log_end
:log_not_running
echo [OK] Lancement du serveur de logs (log-proxy.js) sur le port 3030...
start "Log Proxy" cmd /k "cd /d %~dp0 && node log-proxy.js"
del logproxy.tmp >nul 2>&1
:log_end
echo [DEBUG] Fin test serveur de logs
REM === Fin serveur de logs ===

REM Demarrer le serveur FR24 avec logs visibles ET capturés
echo [1/2] Demarrage du serveur FR24 (port 5001)...
start "FR24 Server" cmd /k "cd /d %~dp0 && echo [FR24] Demarrage du serveur... && python fr24_server.py"

REM Attendre
timeout /t 3 /nobreak >nul

REM Demarrer l'application BoBIconic avec logs visibles ET capturés
echo [2/2] Demarrage de l'application BoBIconic...
echo [INFO] Le serveur demarrera sur le premier port disponible (8100, 4200, ou auto)
start "BoBIconic App" cmd /k "cd /d %~dp0 && echo [BoBIconic] Demarrage de l'application... && ng serve --host=localhost --port=8100 --disable-host-check"

echo.
echo ========================================
echo    Services demarres !
echo ========================================
echo.
echo [PORTS]
echo - Application BoBIconic: http://localhost:8100 (ou port auto)
echo - Serveur FR24: http://localhost:5001
echo.
echo [LOGS]
echo - Logs BoBIconic: logs\app.log (via LoggerService)
echo - Logs FR24: logs\fr24.log (via LoggerService)
echo.
echo [INFO] Les fenetres de commande restent ouvertes
echo [INFO] Fermez les fenetres manuellement pour arreter les services
echo.
echo [INFO] Si le port 8100 est occupe, Angular utilisera un port automatique
echo [INFO] Regardez la fenetre "BoBIconic App" pour voir l'URL exacte 