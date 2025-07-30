@echo off
chcp 65001 >nul
echo ========================================
echo    BoBIconic - Lancement Robuste
echo ========================================
echo.

REM Creer le dossier logs
if not exist "logs" mkdir logs

echo [1/4] Arret des processus existants...
taskkill /f /im node.exe >nul 2>nul
taskkill /f /im python.exe >nul 2>nul
echo [OK] Processus arretes

echo.
echo [2/4] Lancement du serveur de logs...
start "Log Proxy" cmd /k "cd /d %~dp0 && node log-proxy.js"
timeout /t 2 /nobreak >nul

echo.
echo [3/4] Lancement du serveur FR24...
start "FR24 Server" cmd /k "cd /d %~dp0 && python fr24_server.py"
timeout /t 3 /nobreak >nul

echo.
echo [4/4] Lancement de l'application BoBIconic...
start "BoBIconic App" cmd /k "cd /d %~dp0 && ng serve --host=localhost --port=8100 --disable-host-check"

echo.
echo ========================================
echo    SERVICES LANCES !
echo ========================================
echo.
echo [PORTS]
echo - Application: http://localhost:8100
echo - Serveur FR24: http://localhost:5001
echo - Logs: http://localhost:3030
echo.
echo [INFO] Regardez les fenetres ouvertes pour voir les logs
echo [INFO] Fermez les fenetres pour arreter les services
echo.
pause 