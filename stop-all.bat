@echo off
echo ========================================
echo    BoBIconic - Arret des Services
echo ========================================
echo.

echo [INFO] Arret des services BoBIconic...
echo.

:: Arrêter le serveur FR24 (port 5001)
echo [1/2] Arret du serveur FR24 (port 5001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001') do (
    taskkill /f /pid %%a >nul 2>nul
    if !errorlevel! equ 0 (
        echo [OK] Processus FR24 arrete (PID: %%a)
    ) else (
        echo [INFO] Aucun processus FR24 trouve sur le port 5001
    )
)

:: Arrêter l'application BoBIconic (port 8100)
echo [2/2] Arret de l'application BoBIconic (port 8100)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8100') do (
    taskkill /f /pid %%a >nul 2>nul
    if !errorlevel! equ 0 (
        echo [OK] Processus BoBIconic arrete (PID: %%a)
    ) else (
        echo [INFO] Aucun processus BoBIconic trouve sur le port 8100
    )
)

:: Fermer les fenêtres de commande spécifiques
echo.
echo [INFO] Fermeture des fenetres de commande...
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq FR24 Server*" >nul 2>nul
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq BoBIconic App*" >nul 2>nul

echo.
echo ========================================
echo    Services arretes avec succes !
echo ========================================
echo.
echo [INFO] Tous les services ont ete arretes :
echo [INFO] - Serveur FR24 (port 5001)
echo [INFO] - Application BoBIconic (port 8100)
echo.
pause 