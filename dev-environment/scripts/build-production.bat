@echo off
REM ============================================================
REM Script para construir imagenes de produccion (Windows)
REM ============================================================

echo ==========================================
echo   Build de Produccion
echo ==========================================

echo.
echo ^>^> Construyendo Frontend (produccion)...
docker build -t app-frontend:prod --target production ./frontend

echo.
echo ^>^> Construyendo Backend (produccion)...
docker build -t app-backend:prod --target production ./backend

echo.
echo ==========================================
echo   Imagenes de produccion listas!
echo ==========================================
echo.
echo   app-frontend:prod
echo   app-backend:prod
echo.
echo   Para ejecutar con nginx reverse proxy:
echo   docker compose --profile production up -d
echo ==========================================
echo.
pause
