# Ambiente de Desarrollo Full-Stack con Docker

## Stack Tecnológico

| Componente | Tecnología | Versión | Puerto |
|---|---|---|---|
| Frontend | React + Vite + TypeScript | 19.2.x | 3000 |
| Backend | Spring Boot + Java | 4.0.2 / Java 25 | 8080 |
| Base de Datos | PostgreSQL + PostGIS | 17 / 3.5 | 5432 |
| Admin DB | pgAdmin 4 | latest | 5050 |
| Debug Java | JDWP | - | 5005 |
| Reverse Proxy | Nginx (solo producción) | alpine | 80 |

---

## Prerequisitos

1. **Docker Desktop** instalado y corriendo
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Requiere WSL2 habilitado en Windows 11

2. **Git** (opcional, para control de versiones)

3. **Recursos mínimos recomendados asignados a Docker:**
   - CPUs: 4
   - Memoria: 8 GB
   - Disk: 40 GB

---

## Estructura del Proyecto

```
dev-environment/
├── docker-compose.yml          # Orquestación de contenedores
├── .env                        # Variables de entorno
├── .env.example                # Plantilla de variables
├── .gitignore
├── .dockerignore
├── INSTRUCCIONES.md
│
├── frontend/                   # React 19 + Vite + TypeScript
│   ├── Dockerfile              # Multi-stage (dev + prod)
│   ├── nginx.conf              # Config Nginx para SPA (prod)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── index.html
│   ├── public/
│   │   └── vite.svg
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── App.css
│       ├── index.css
│       ├── vite-env.d.ts
│       ├── components/
│       ├── pages/
│       │   └── Home.tsx
│       ├── services/
│       │   └── api.ts
│       └── test/
│           ├── setup.ts
│           └── App.test.tsx
│
├── backend/                    # Spring Boot 4 + Java 25
│   ├── Dockerfile              # Multi-stage (dev + prod)
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/app/demo/
│       │   │   ├── DemoApplication.java
│       │   │   ├── config/
│       │   │   │   └── CorsConfig.java
│       │   │   ├── controller/
│       │   │   │   ├── HealthController.java
│       │   │   │   └── LocationController.java
│       │   │   ├── model/
│       │   │   │   └── Location.java
│       │   │   ├── repository/
│       │   │   │   └── LocationRepository.java
│       │   │   └── service/
│       │   │       └── LocationService.java
│       │   └── resources/
│       │       ├── application.yml
│       │       └── application-test.yml
│       └── test/java/com/app/demo/
│           └── DemoApplicationTests.java
│
├── database/
│   └── init/                   # Scripts SQL de inicialización
│       ├── 01-init-extensions.sql
│       └── 02-create-schemas.sql
│
├── pgadmin/
│   └── servers.json            # Auto-registro del servidor PostgreSQL
│
├── nginx/
│   └── nginx.conf              # Reverse proxy (perfil production)
│
└── scripts/
    ├── start-dev.sh            # Iniciar desarrollo (Linux/Mac)
    ├── start-dev.bat           # Iniciar desarrollo (Windows)
    ├── build-production.sh     # Build producción (Linux/Mac)
    └── build-production.bat    # Build producción (Windows)
```

---

## Inicio Rápido

### 1. Clonar/Copiar el proyecto

Navega a la carpeta `dev-environment`:

```bash
cd dev-environment
```

### 2. Configurar variables de entorno

```bash
# Copiar plantilla (para producción cambiar contraseñas)
cp .env.example .env
```

### 3. Levantar el ambiente de desarrollo

**Windows:**
```cmd
scripts\start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

**O directamente con Docker Compose:**
```bash
docker compose up -d --build
```

### 4. Verificar que todo funciona

| Servicio | URL | Credenciales |
|---|---|---|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:8080/api/health | - |
| pgAdmin | http://localhost:5050 | admin@admin.com / admin |
| Actuator | http://localhost:8080/actuator/health | - |

---

## Desarrollo Día a Día

### Hot Reload Automático

- **Frontend (React):** Los cambios en `frontend/src/` se reflejan automáticamente en el navegador gracias a Vite HMR.
- **Backend (Spring Boot):** DevTools detecta cambios en `backend/src/` y reinicia el contexto automáticamente.

### Editar código

Simplemente edita los archivos en tu IDE favorito (VS Code, IntelliJ, etc.) directamente en las carpetas `frontend/src/` y `backend/src/`. Los volúmenes de Docker sincronizan los cambios automáticamente.

### Comandos útiles

```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# Reiniciar un servicio
docker compose restart backend

# Detener todo
docker compose down

# Detener y eliminar volúmenes (CUIDADO: borra datos de BD)
docker compose down -v

# Reconstruir un servicio
docker compose build backend --no-cache
docker compose up -d backend

# Ejecutar comando dentro del contenedor
docker compose exec backend bash
docker compose exec frontend sh
docker compose exec postgres psql -U appuser -d appdb

# Ver estado de los contenedores
docker compose ps
```

### Instalar dependencias nuevas

**Frontend (npm):**
```bash
# Opción 1: Ejecutar dentro del contenedor
docker compose exec frontend npm install axios

# Opción 2: Editar package.json y reconstruir
docker compose build frontend
docker compose up -d frontend
```

**Backend (Maven):**
```bash
# Editar pom.xml y reiniciar
docker compose restart backend
```

---

## Base de Datos

### Acceso directo con psql

```bash
docker compose exec postgres psql -U appuser -d appdb
```

### Consultas PostGIS de ejemplo

```sql
-- Verificar versión de PostGIS
SELECT PostGIS_Full_Version();

-- Ver ubicaciones
SELECT id, name, ST_AsText(coordinates) FROM app.locations;

-- Buscar puntos cercanos (radio de 10km desde Ciudad de México)
SELECT name, ST_Distance(
    coordinates::geography,
    ST_SetSRID(ST_MakePoint(-99.1332, 19.4326), 4326)::geography
) AS distance_meters
FROM app.locations
WHERE ST_DWithin(
    coordinates::geography,
    ST_SetSRID(ST_MakePoint(-99.1332, 19.4326), 4326)::geography,
    10000
)
ORDER BY distance_meters;
```

### pgAdmin

1. Abrir http://localhost:5050
2. El servidor PostgreSQL ya está pre-configurado automáticamente
3. Contraseña del servidor: `apppassword` (o la que definas en `.env`)

---

## Pruebas

### Frontend

```bash
# Ejecutar tests
docker compose exec frontend npm test

# Tests con UI
docker compose exec frontend npm run test:ui

# Cobertura
docker compose exec frontend npm run test:coverage
```

### Backend

```bash
# Ejecutar tests
docker compose exec backend mvn test

# Test específico
docker compose exec backend mvn test -Dtest=DemoApplicationTests
```

---

## Debug

### Java Remote Debug

El backend expone el puerto **5005** para depuración remota.

**Configuración en IntelliJ IDEA:**
1. Run > Edit Configurations > + > Remote JVM Debug
2. Host: `localhost`, Port: `5005`
3. Module classpath: `demo`
4. Click Debug

**Configuración en VS Code (launch.json):**
```json
{
    "type": "java",
    "name": "Attach to Docker",
    "request": "attach",
    "hostName": "localhost",
    "port": 5005
}
```

### Frontend Debug

Usa las DevTools del navegador. Vite genera sourcemaps automáticamente.

---

## Build de Producción

### Construir imágenes optimizadas

**Windows:**
```cmd
scripts\build-production.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/build-production.sh
./scripts/build-production.sh
```

### Ejecutar en modo producción (con Nginx)

```bash
docker compose --profile production up -d
```

Esto levanta un Nginx en el puerto 80 que actúa como reverse proxy:
- `/api/*` -> Backend (Spring Boot)
- `/*` -> Frontend (React build estático)

### Imágenes resultantes

| Imagen | Descripción | Base |
|---|---|---|
| `app-frontend:prod` | React build estático servido con Nginx | nginx:alpine |
| `app-backend:prod` | JAR optimizado con JRE mínimo | eclipse-temurin:25-jre |

---

## API Endpoints incluidos

| Método | URL | Descripción |
|---|---|---|
| GET | `/api/health` | Estado del sistema |
| GET | `/api/locations` | Listar ubicaciones |
| GET | `/api/locations/{id}` | Obtener ubicación por ID |
| POST | `/api/locations` | Crear ubicación |
| GET | `/api/locations/nearby?lat=&lng=&distance=` | Buscar cercanas |
| DELETE | `/api/locations/{id}` | Eliminar ubicación |

**Ejemplo POST crear ubicación:**
```json
{
    "name": "Mi Ubicación",
    "description": "Descripción del punto",
    "lat": 19.4326,
    "lng": -99.1332
}
```

---

## Resolución de Problemas

### El contenedor no inicia

```bash
# Ver logs detallados
docker compose logs backend
docker compose logs postgres

# Verificar que los puertos no estén ocupados
netstat -ano | findstr :8080
netstat -ano | findstr :5432
netstat -ano | findstr :3000
```

### Problemas de permisos en Windows

Si hay errores de permisos con volúmenes, asegurar que la carpeta del proyecto esté dentro del filesystem de Windows (no WSL) o configurar Docker Desktop para compartir la unidad.

### Reiniciar limpio

```bash
# Detener todo y eliminar volúmenes, redes e imágenes
docker compose down -v --rmi local
docker compose up -d --build
```

### El frontend no se actualiza

```bash
# Reiniciar el contenedor de frontend
docker compose restart frontend

# O reconstruir
docker compose build frontend --no-cache
docker compose up -d frontend
```

### Error de conexión a la base de datos

```bash
# Verificar que PostgreSQL esté healthy
docker compose ps

# Conectarse manualmente para verificar
docker compose exec postgres pg_isready -U appuser
```
