@echo off
echo ========================================
echo MATANDO TODOS LOS PROCESOS DE NODE.JS
echo ========================================
echo.

taskkill /F /IM node.exe /T

echo.
echo Procesos de Node.js eliminados.
echo.
pause
