@echo off
title Llavero - Iniciando...
color 0A
setlocal enabledelayedexpansion

echo.
echo  ==========================================
echo   LLAVERO - Sistema de Hospedaje
echo  ==========================================
echo.

:: ===== 1. PostgreSQL =====
echo  [1/3] Verificando PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if errorlevel 1 (
    echo  [!] PostgreSQL no esta corriendo.
    echo  [!] Iniciando PostgreSQL...
    net start postgresql-x64-15 >nul 2>&1
    net start postgresql-x64-16 >nul 2>&1
    net start postgresql-x64-17 >nul 2>&1
    timeout /t 3 /nobreak >nul

    pg_isready -h localhost -p 5432 >nul 2>&1
    if errorlevel 1 (
        echo.
        echo  [ERROR] PostgreSQL NO arranco. Sin base de datos el sistema no funciona.
        echo          Abre "Servicios" de Windows y inicia el servicio postgresql manualmente.
        echo.
        pause
        exit /b 1
    )
)
echo  [OK] PostgreSQL listo.

:: ===== 2. Backend =====
echo.
echo  [2/3] Iniciando backend Spring Boot...
start "Llavero - Backend" cmd /k "cd /d "%~dp0backend" && echo Iniciando Spring Boot... && mvn spring-boot:run"

:: Esperar a que el backend responda en /api/auth/usuarios (max 120 seg)
echo  Esperando que el servidor responda...
set /a intentos=0
:wait_backend
set /a intentos+=1
if !intentos! gtr 60 (
    echo.
    echo  [ERROR] El backend no respondio en 2 minutos.
    echo          Revisa la ventana "Llavero - Backend" para ver el error.
    echo.
    pause
    exit /b 1
)
curl -s -o nul -w "%%{http_code}" http://localhost:8080/api/auth/usuarios > "%TEMP%\llavero_check.txt" 2>nul
set /p HTTP_CODE=<"%TEMP%\llavero_check.txt"
del "%TEMP%\llavero_check.txt" 2>nul
if "!HTTP_CODE!"=="200" goto backend_ok
timeout /t 2 /nobreak >nul
<nul set /p ".=."
goto wait_backend

:backend_ok
echo.
echo  [OK] Backend respondiendo en http://localhost:8080

:: ===== 3. ngrok =====
echo.
echo  [3/3] Iniciando ngrok...
start "Llavero - Ngrok (URL publica)" cmd /k "ngrok http 8080"

echo.
echo  ==========================================
echo   Sistema iniciado correctamente.
echo.
echo   Revisa la ventana "Llavero - Ngrok"
echo   para ver la URL publica y compartirla.
echo.
echo   Acceso al sistema:
echo     Local:   http://localhost:8080/llavero
echo     Remoto:  [URL de ngrok]/llavero
echo  ==========================================
echo.
pause
