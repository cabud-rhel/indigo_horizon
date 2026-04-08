@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo   AbUd Proyectos - Construyendo para Produccion
echo ==========================================

REM Verificar si Node.js está instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado. Por favor, instalo desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    call npm install
)

echo [INFO] Generando archivos de produccion - carpeta dist...
call npm run build

echo.
echo ==========================================
echo   [EXITO] Los archivos estan en la carpeta dist
echo   Puedes subir el contenido de dist a cualquier
echo   servidor web - Hostinger, Netlify, Vercel, etc.
echo ==========================================
echo.
pause
