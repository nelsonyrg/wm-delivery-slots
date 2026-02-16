#!/bin/bash
# ============================================================
# Script para construir imágenes de producción
# ============================================================

set -e

echo "=========================================="
echo "  Build de Producción"
echo "=========================================="

# Build del frontend
echo ""
echo ">> Construyendo Frontend (producción)..."
docker build -t app-frontend:prod --target production ./frontend

# Build del backend
echo ""
echo ">> Construyendo Backend (producción)..."
docker build -t app-backend:prod --target production ./backend

echo ""
echo "=========================================="
echo "  Imágenes de producción listas!"
echo "=========================================="
echo ""
echo "  app-frontend:prod"
echo "  app-backend:prod"
echo ""
echo "  Para ejecutar con nginx reverse proxy:"
echo "  docker compose --profile production up -d"
echo "=========================================="
