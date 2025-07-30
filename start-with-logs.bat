@echo off
echo ========================================
echo BoBIconic - Lancement avec capture logs
echo ========================================
echo.

REM Créer le dossier logs s'il n'existe pas
if not exist "logs" mkdir logs

REM Nettoyer l'ancien fichier de log
if exist "logs\app.log" del "logs\app.log"

echo [%date% %time%] Démarrage de l'application BoBIconic...
echo [%date% %time%] Démarrage de l'application BoBIconic... >> logs\app.log

echo.
echo Lancement de ng serve avec capture des logs...
echo Les logs sont sauvegardés dans logs\app.log
echo Appuyez sur Ctrl+C pour arrêter
echo.

REM Lancer ng serve et capturer tous les logs
ng serve --host=localhost --port=8100 --disable-host-check > logs\app.log 2>&1

echo.
echo [%date% %time%] Arrêt de l'application BoBIconic
echo [%date% %time%] Arrêt de l'application BoBIconic >> logs\app.log

pause 