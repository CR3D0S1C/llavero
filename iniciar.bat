@echo off
title Llavero - Iniciando...
color 0A
setlocal enabledelayedexpansion

echo.
echo  ==========================================
echo   LLAVERO - Sistema de Hospedaje
echo  ==========================================
echo.

:: ===== 0. Liberar puertos =====
echo  [0/4] Liberando puertos anteriores...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8080 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo  [OK] Puertos listos.

:: ===== 1. PostgreSQL =====
echo.
echo  [1/4] Verificando PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if errorlevel 1 (
    echo  [!] PostgreSQL no esta corriendo. Intentando iniciar...
    net start postgresql-x64-15 >nul 2>&1
    net start postgresql-x64-16 >nul 2>&1
    net start postgresql-x64-17 >nul 2>&1
    timeout /t 3 /nobreak >nul
    pg_isready -h localhost -p 5432 >nul 2>&1
    if errorlevel 1 (
        echo.
        echo  [ERROR] PostgreSQL NO arranco.
        echo          Abre "Servicios" de Windows e inicia postgresql manualmente.
        echo.
        pause
        exit /b 1
    )
)
echo  [OK] PostgreSQL listo.

:: ===== 2. Build panel admin (frontend POS) =====
echo.
echo  [2/4] Compilando panel admin...
cd /d "%~dp0frontend"
call npm install --silent 2>nul
call npm run build
if errorlevel 1 (
    echo.
    echo  [ERROR] El build del panel admin fallo.
    echo          Revisa los errores de npm arriba.
    echo.
    pause
    exit /b 1
)
echo  [OK] Panel admin compilado.

:: ===== 3. Build sitio publico =====
echo.
echo  [3/4] Compilando sitio publico de reservas...
cd /d "%~dp0frontend-publico"
call npm install --silent 2>nul
call npm run build
if errorlevel 1 (
    echo.
    echo  [ERROR] El build del sitio publico fallo.
    echo          Revisa los errores de npm arriba.
    echo.
    pause
    exit /b 1
)
cd /d "%~dp0"
echo  [OK] Sitio publico compilado.

:: ===== 4. Backend Spring Boot =====
echo.
echo  [4/4] Iniciando backend Spring Boot (puede tardar 30-60 seg)...
start "Llavero - Backend" cmd /k "cd /d "%~dp0backend" && echo Compilando y arrancando Spring Boot... && mvn spring-boot:run"

echo  Esperando que el servidor responda...
set /a intentos=0
:wait_backend
set /a intentos+=1
if !intentos! gtr 90 (
    echo.
    echo  [ERROR] El backend no respondio en 3 minutos.
    echo          Revisa la ventana "Llavero - Backend" para ver el error.
    echo.
    pause
    exit /b 1
)
curl -s -o nul -w "%%{http_code}" http://localhost:8080/api/auth/usuarios > "%TEMP%\llavero_check.txt" 2>nul
set /p HTTP_CODE=<"%TEMP%\llavero_check.txt"
del "%TEMP%\llavero_check.txt" 2>nul
if "!HTTP_CODE!"=="200" goto backend_ok
if "!HTTP_CODE!"=="401" goto backend_ok
timeout /t 2 /nobreak >nul
set /a mod=!intentos! %% 15
if !mod!==0 (
    echo  [!] Aun esperando... (!intentos! intentos)
)
goto wait_backend

:backend_ok
echo  [OK] Backend respondiendo en http://localhost:8080

:: ===== Cloudflare Tunnel =====
echo.
echo  Iniciando Cloudflare Tunnel...
start "Llavero - Tunnel" cmd /k "cloudflared tunnel run mimaravillahostal"
timeout /t 3 /nobreak >nul

echo.
echo  ==========================================
echo   Sistema iniciado correctamente.
echo.
echo   Acceso LOCAL:
echo     Sitio publico:  http://localhost:8080
echo     Panel admin:    http://localhost:8080/llavero
echo.
echo   Acceso REMOTO (URL fija para siempre):
echo     Sitio publico:  https://mimaravillahostal.com
echo     Panel admin:    https://mimaravillahostal.com/llavero
echo.
echo  ==========================================
echo.

timeout /t 3 /nobreak >nul
start "" "https://mimaravillahostal.com/llavero"

pause
