@echo off
echo ========================================
echo    BoBIconic - Demarrage Hybride
echo ========================================
echo.

:: Vérifier que Node.js est installé
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js n'est pas installé ou n'est pas dans le PATH
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

:: Vérifier que Python est installé
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Python n'est pas installé ou n'est pas dans le PATH
    echo Veuillez installer Python depuis https://python.org/
    pause
    exit /b 1
)

:: Vérifier que les dépendances Node.js sont installées
if not exist "node_modules" (
    echo [INFO] Installation des dependances Node.js...
    npm install
    if %errorlevel% neq 0 (
        echo [ERREUR] Echec de l'installation des dependances Node.js
        pause
        exit /b 1
    )
)

:: Vérifier que les dépendances Python sont installées
echo [INFO] Verification des dependances Python...
python -c "import flask, flask_cors, pyflightdata, requests" 2>nul
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

:: Arrêter le serveur FR24 (port 5001)
echo [1/2] Arret du serveur FR24 (port 5001)...
netstat -ano | findstr :5001 >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001') do taskkill /f /pid %%a >nul 2>nul
    echo [OK] Processus FR24 arrete
) else (
    echo [INFO] Aucun processus FR24 trouve sur le port 5001
)

:: Arrêter l'application BoBIconic (port 8100)
echo [2/2] Arret de l'application BoBIconic (port 8100)...
netstat -ano | findstr :8100 >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8100') do taskkill /f /pid %%a >nul 2>nul
    echo [OK] Processus BoBIconic arrete
) else (
    echo [INFO] Aucun processus BoBIconic trouve sur le port 8100
)

:: Fermer les fenêtres de commande spécifiques
echo.
echo [INFO] Fermeture des fenetres de commande existantes...
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq FR24 Server*" >nul 2>nul
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq BoBIconic App*" >nul 2>nul

:: Attendre un peu pour que les processus se ferment complètement
echo [INFO] Attente de la fermeture des processus...
timeout /t 3 /nobreak >nul

echo.
echo [INFO] Demarrage des services...
echo.

:: Démarrer le serveur FR24 (port 5001)
echo [1/2] Demarrage du serveur FR24 (port 5001)...
start "FR24 Server" cmd /k "cd /d %~dp0 && echo [FR24] Demarrage du serveur... && python fr24_server.py"

:: Attendre un peu pour que le serveur démarre
timeout /t 3 /nobreak >nul

:: Démarrer l'application Ionic/Angular (port 8100)
echo [2/2] Demarrage de l'application BoBIconic (port 8100)...
start "BoBIconic App" cmd /k "cd /d %~dp0 && echo [BoBIconic] Demarrage de l'application... && npm start"

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
echo [INFO] - Serveur FR24 local disponible pour météo et photos
echo.
echo [INFO] Les fenetres de commande restent ouvertes pour voir les logs
echo [INFO] Fermez les fenetres pour arreter les services
echo.
pause