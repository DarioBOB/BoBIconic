@echo off
chcp 65001 >nul
echo ========================================
echo    BoBIconic - Demarrage Hybride
echo ========================================
echo.

echo [DEBUG] Verification Node.js...
:: Verifier que Node.js est installe
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installe ou n'est pas dans le PATH
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo [DEBUG] Verification Python...
:: Verifier que Python est installe
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Python n'est pas installe ou n'est pas dans le PATH
    echo Veuillez installer Python depuis https://python.org/
    pause
    exit /b 1
)

echo [DEBUG] Verification dependances Node.js...
:: Verifier que les dependances Node.js sont installees
if not exist "node_modules" (
    echo [INFO] Installation des dependances Node.js...
    npm install
    if %errorlevel% neq 0 (
        echo [ERREUR] Echec de l'installation des dependances Node.js
        pause
        exit /b 1
    )
)

echo [DEBUG] Verification dependances Python...
:: Verifier que les dependances Python sont installees
echo [INFO] Verification des dependances Python...
python -c "import flask" 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installation des dependances Python...
    pip install flask flask-cors pyflightdata requests
    if %errorlevel% neq 0 (
        echo [ERREUR] Echec de l'installation des dependances Python
        pause
        exit /b 1
    )
)

echo.
echo [INFO] Arret des services existants...
echo.

echo [DEBUG] Verification ports...
:: Verifier que les ports ne sont pas deja utilises
netstat -ano | findstr ":5001" >nul
if %errorlevel% equ 0 (
    echo [ERREUR] Le port 5001 (FR24) est deja utilise. Arretez le processus avant de relancer.
    pause
    exit /b 1
)
netstat -ano | findstr ":8100" >nul
if %errorlevel% equ 0 (
    echo [ERREUR] Le port 8100 (BoBIconic) est deja utilise. Arretez le processus avant de relancer.
    pause
    exit /b 1
)

echo [DEBUG] Arret FR24...
:: Arreter le serveur FR24 (port 5001)
echo [1/2] Arret du serveur FR24 (port 5001)...
netstat -ano | findstr :5001 >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001') do taskkill /f /pid %%a >nul 2>nul
    echo [OK] Processus FR24 arrete
) else (
    echo [INFO] Aucun processus FR24 trouve sur le port 5001
)

echo [DEBUG] Arret BoBIconic...
:: Arreter l'application BoBIconic (port 8100)
echo [2/2] Arret de l'application BoBIconic (port 8100)...
netstat -ano | findstr :8100 >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8100') do taskkill /f /pid %%a >nul 2>nul
    echo [OK] Processus BoBIconic arrete
) else (
    echo [INFO] Aucun processus BoBIconic trouve sur le port 8100
)

echo [DEBUG] Fermeture fenetres...
:: Fermer les fenetres de commande specifiques
echo.
echo [INFO] Fermeture des fenetres de commande existantes...
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq FR24 Server*" >nul 2>nul
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq BoBIconic App*" >nul 2>nul

:: Attendre un peu pour que les processus se ferment completement
echo [INFO] Attente de la fermeture des processus...
timeout /t 3 /nobreak >nul

echo.
echo [INFO] Demarrage des services...
echo.

echo [DEBUG] Demarrage FR24...
:: Demarrer le serveur FR24 (port 5001) avec log
if not exist "logs" mkdir logs
start "FR24 Server" cmd /k "cd /d %~dp0 && echo [FR24] Demarrage du serveur... && python fr24_server.py > logs\fr24.log 2>&1"

:: Attendre un peu pour que le serveur demarre
timeout /t 3 /nobreak >nul

echo [DEBUG] Demarrage BoBIconic...
:: Demarrer l'application Ionic/Angular (port 8100) avec log
start "BoBIconic App" cmd /k "cd /d %~dp0 && echo [BoBIconic] Demarrage de l'application... && .\start-with-logs.bat"

echo.
echo ========================================
echo    Services demarres avec succes !
echo ========================================
echo.
echo [PORTS]
echo - Application BoBIconic: http://localhost:8100
echo - Serveur FR24: http://localhost:5001
echo.
echo [ADMIN]
echo - Interface Admin: http://localhost:8100/admin
echo - Logs: http://localhost:8100/admin/logs
echo.
echo [INFO] Architecture hybride active :
echo [INFO] - BoBIconic utilise FR24Service pour les appels directs
echo [INFO] - Serveur FR24 local disponible pour meteo et photos
echo.
echo [INFO] Les fenetres de commande restent ouvertes pour voir les logs
echo [INFO] Fermez les fenetres pour arreter les services
echo.
pause