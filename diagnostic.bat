@echo off
echo ========================================
echo    DIAGNOSTIC BoBIconic
echo ========================================
echo.

echo [1/4] Test Node.js...
node --version
if %errorlevel% neq 0 (
    echo [ERREUR] Node.js non fonctionnel
    pause
    exit /b 1
)
echo [OK] Node.js fonctionne

echo.
echo [2/4] Test Python...
python --version
if %errorlevel% neq 0 (
    echo [ERREUR] Python non fonctionnel
    pause
    exit /b 1
)
echo [OK] Python fonctionne

echo.
echo [3/4] Test ports...
echo Ports utilises:
netstat -an | findstr ":8100\|:5001\|:3030"

echo.
echo [4/4] Test serveur de logs...
echo Lancement du serveur de logs...
start "Log Proxy Test" cmd /c "node log-proxy.js & pause"

echo.
echo ========================================
echo    DIAGNOSTIC TERMINE
echo ========================================
echo.
echo Si le serveur de logs s'est lance, tu verras:
echo "Log proxy listening on http://localhost:3030"
echo.
pause 