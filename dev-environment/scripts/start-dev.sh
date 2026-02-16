#!/bin/bash
# ============================================================
# Script para iniciar el ambiente de desarrollo
# ============================================================

set -e

echo "=========================================="
echo "  Iniciando Ambiente de Desarrollo"
echo "=========================================="

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker no está corriendo. Inicia Docker Desktop primero."
    exit 1
fi

# Construir y levantar contenedores
echo ""
echo ">> Construyendo imágenes..."
docker compose build

echo ""
echo ">> Levantando contenedores..."
docker compose up -d

echo ""
echo ">> Esperando a que los servicios estén listos..."
sleep 5

# Verificar estado
echo ""
echo ">> Estado de los contenedores:"
docker compose ps

echo ""
echo "=========================================="
echo "  Ambiente Listo!"
echo "=========================================="
echo ""
echo "  Frontend (React):    http://localhost:3000"
echo "  Backend (Spring):    http://localhost:8080"
echo "  PgAdmin:             http://localhost:5050"
echo "  PostgreSQL:          localhost:5432"
echo "  Debug (Java):        localhost:5005"
echo ""
echo "  Para ver logs:       docker compose logs -f"
echo "  Para detener:        docker compose down"
echo "=========================================="
