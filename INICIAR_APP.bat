@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo   AbUd Proyectos - Iniciando Aplicacion
echo ==========================================

REM Verificar si Node.js está instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado. Por favor, instalo desde: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si node_modules existe, si no, instalar
if not exist "node_modules" (
    echo [INFO] Instalando dependencias - esto solo ocurrira la primera vez...
    call npm install
)

echo [INFO] Iniciando servidor de desarrollo...
echo [INFO] La aplicacion se abrira en tu navegador automaticamente (usualmente en http://localhost:5173)
echo.

call npm run dev

pause
