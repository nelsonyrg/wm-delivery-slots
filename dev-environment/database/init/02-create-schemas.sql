-- ============================================================
-- Esquemas base de la aplicación
-- ============================================================

-- Esquema principal de la aplicación
CREATE SCHEMA IF NOT EXISTS app;

-- Esquema para datos geoespaciales
CREATE SCHEMA IF NOT EXISTS geo;

-- Otorgar permisos
GRANT ALL ON SCHEMA app TO appuser;
GRANT ALL ON SCHEMA geo TO appuser;
GRANT USAGE ON SCHEMA public TO appuser;

-- Tabla de ejemplo con soporte geoespacial
CREATE TABLE IF NOT EXISTS app.locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    coordinates GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice espacial
CREATE INDEX IF NOT EXISTS idx_locations_coordinates
    ON app.locations USING GIST (coordinates);

-- Insertar dato de prueba
INSERT INTO app.locations (name, description, coordinates)
VALUES (
    'Punto de Prueba',
    'Ubicación de ejemplo para verificar PostGIS',
    ST_SetSRID(ST_MakePoint(-99.1332, 19.4326), 4326)
);
