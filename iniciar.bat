@echo off
title Llavero - Iniciando...
color 0A

echo.
echo  ==========================================
echo   LLAVERO - Sistema de Hospedaje
echo  ==========================================
echo.

:: Verificar que PostgreSQL este corriendo
echo  [1/3] Verificando PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if errorlevel 1 (
    echo  [!] PostgreSQL no esta corriendo.
    echo  [!] Iniciando PostgreSQL...
    net start postgresql-x64-15 >nul 2>&1
    net start postgresql-x64-16 >nul 2>&1
    net start postgresql-x64-17 >nul 2>&1
    timeout /t 3 /nobreak >nul
)
echo  [OK] PostgreSQL listo.

:: Iniciar backend en nueva ventana
echo.
echo  [2/3] Iniciando backend Spring Boot...
start "Llavero - Backend" cmd /k "cd /d "%~dp0backend" && echo Iniciando Spring Boot... && mvn spring-boot:run"

:: Esperar a que Spring Boot arranque
echo  Esperando que el servidor arranque (30 seg)...
timeout /t 30 /nobreak >nul

:: Iniciar ngrok en nueva ventana
echo.
echo  [3/3] Iniciando ngrok...
start "Llavero - Ngrok (URL publica)" cmd /k "ngrok http 8080"

echo.
echo  ==========================================
echo   Sistema iniciado correctamente.
echo.
echo   Revisa la ventana "Llavero - Ngrok"
echo   para ver la URL publica y compartirla.
echo  ==========================================
echo.
pause
