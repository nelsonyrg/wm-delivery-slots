@echo off
setlocal
REM ============================================================
REM Script para iniciar el ambiente de desarrollo (Windows)
REM ============================================================

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%\..") do set "DEV_ENV_DIR=%%~fI"
for %%I in ("%DEV_ENV_DIR%\..") do set "PROJECT_ROOT=%%~fI"
set "SQL_FILE=%PROJECT_ROOT%\delivery_slots_schema.sql"

echo ==========================================
echo   Iniciando Ambiente de Desarrollo
echo ==========================================

if not exist "%SQL_FILE%" (
    echo ERROR: No se encontro el archivo SQL en "%SQL_FILE%".
    pause
    exit /b 1
)

pushd "%DEV_ENV_DIR%" >nul
if %errorlevel% neq 0 (
    echo ERROR: No se pudo acceder a "%DEV_ENV_DIR%".
    pause
    exit /b 1
)

REM Verificar que Docker esta corriendo
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker no esta corriendo. Inicia Docker Desktop primero.
    popd
    pause
    exit /b 1
)

echo.
echo ^>^> Construyendo imagenes...
docker compose build
if %errorlevel% neq 0 (
    echo ERROR: Fallo la construccion de imagenes.
    popd
    pause
    exit /b 1
)

echo.
echo ^>^> Levantando contenedores...
docker compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Fallo al levantar los contenedores.
    popd
    pause
    exit /b 1
)

echo.
echo ^>^> Esperando a que PostgreSQL este listo...
set /a retries=0
:wait_postgres
docker compose exec -T postgres sh -c "pg_isready -U $POSTGRES_USER -d $POSTGRES_DB" >nul 2>&1
if %errorlevel% equ 0 goto postgres_ready
set /a retries+=1
if %retries% geq 60 goto postgres_timeout
timeout /t 2 /nobreak >nul
goto wait_postgres

:postgres_timeout
echo ERROR: PostgreSQL no estuvo listo a tiempo.
popd
pause
exit /b 1

:postgres_ready
echo ^>^> Ejecutando esquema SQL: %SQL_FILE%
docker compose exec -T postgres sh -c "psql -v ON_ERROR_STOP=1 -U $POSTGRES_USER -d $POSTGRES_DB" < "%SQL_FILE%"
if %errorlevel% neq 0 (
    echo ERROR: Fallo la ejecucion de delivery_slots_schema.sql.
    popd
    pause
    exit /b 1
)

echo.
echo ^>^> Estado de los contenedores:
docker compose ps

echo.
echo ==========================================
echo   Ambiente Listo!
echo ==========================================
echo.
echo   Frontend (React):    http://localhost:3000
echo   Backend (Spring):    http://localhost:8080
echo   PgAdmin:             http://localhost:5050
echo   PostgreSQL:          localhost:5432
echo   Debug (Java):        localhost:5005
echo.
echo   Para ver logs:       docker compose logs -f
echo   Para detener:        docker compose down
echo ==========================================
echo.
popd
pause
