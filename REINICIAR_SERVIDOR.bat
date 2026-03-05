@echo off
echo ========================================
echo REINICIANDO SERVIDOR BACKEND
echo ========================================
echo.

echo Matando procesos de Node.js...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Limpiando puertos...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000') DO (
    taskkill /F /PID %%P 2>nul
)
timeout /t 1 /nobreak >nul

echo.
echo Navegando al directorio del backend...
cd /d "%~dp0apps\api"

echo.
echo Iniciando servidor backend...
echo.
start cmd /k "npm run dev"

echo.
echo ========================================
echo SERVIDOR REINICIADO
echo ========================================
echo.
echo Espera 10 segundos y verifica los logs
echo Busca la linea: Mapped {/api/users/:id/soft-delete, POST} route
echo.
pause
