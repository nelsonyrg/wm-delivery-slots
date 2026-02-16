-- ============================================================
-- SISTEMA DE VENTANAS DE DESPACHO CON COBERTURA GEOGRÁFICA
-- PostgreSQL 17 + PostGIS 3.5
-- Modelo de datos relacional con soporte geoespacial
-- ============================================================

-- ============================================================
-- 0. EXTENSIÓN PostGIS (requiere instalación previa del paquete)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- 0b. ESQUEMA DE APLICACIÓN
-- ============================================================
CREATE SCHEMA IF NOT EXISTS app;
SET search_path TO app, public;

-- ============================================================
-- TIPO ENUM para estados de reserva
-- ============================================================
CREATE TYPE app.reservation_status AS ENUM ('CONFIRMED', 'CANCELLED', 'EXPIRED');

-- ============================================================
-- 1. DIVISIÓN POLÍTICO-ADMINISTRATIVA DE CHILE
--    Jerarquía: region → ciudad → comuna
-- ============================================================

CREATE TABLE app.region (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    ordinal     INT          NOT NULL,              -- Número romano de la región (ej: 1 = I, 13 = RM)
    abbreviation VARCHAR(10) NOT NULL,              -- Abreviatura (ej: "I", "II", "RM", "XVI")

    CONSTRAINT uq_region_name UNIQUE (name),
    CONSTRAINT uq_region_ordinal UNIQUE (ordinal)
);

CREATE TABLE app.ciudad (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    region_id   BIGINT       NOT NULL,

    CONSTRAINT fk_ciudad_region
        FOREIGN KEY (region_id) REFERENCES app.region(id)
            ON DELETE CASCADE,
    CONSTRAINT uq_ciudad_name_region UNIQUE (name, region_id)
);

CREATE INDEX idx_ciudad_region ON app.ciudad (region_id);

CREATE TABLE app.comuna (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    ciudad_id   BIGINT       NOT NULL,

    CONSTRAINT fk_comuna_ciudad
        FOREIGN KEY (ciudad_id) REFERENCES app.ciudad(id)
            ON DELETE CASCADE,
    CONSTRAINT uq_comuna_name_ciudad UNIQUE (name, ciudad_id)
);

CREATE INDEX idx_comuna_ciudad ON app.comuna (ciudad_id);

-- ============================================================
-- 3. ZONAS DE COBERTURA GEOGRÁFICA
--    (fusión de las antiguas tablas zone + zone_coverage)
--    Cada registro representa una zona de cobertura con su
--    polígono geográfico, datos de localidad y relación al slot.
-- ============================================================
-- NOTA: zone_coverage tiene FK a delivery_slot (delivery_slot_id).
--       La FK se agrega con ALTER TABLE después de crear delivery_slot
--       para evitar dependencia circular en el orden de creación.
CREATE TABLE app.zone_coverage (
    id               BIGSERIAL    PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,                    -- Nombre de la zona. Ej: "La Serena Centro"
    comuna_id        BIGINT       NULL,                        -- FK a comuna (división administrativa)
    commune          VARCHAR(100) NOT NULL,                    -- Comuna (texto legacy)
    region           VARCHAR(100) NOT NULL,                    -- Región (texto legacy)
    locality         VARCHAR(150) NULL,                        -- Localidad / dirección parcial (opcional)
    postal_code      VARCHAR(20)  NULL,                        -- Código postal (opcional)
    delivery_slot_id BIGINT       NULL,                        -- FK a delivery_slot (1 zone_coverage → 1 slot, 1 slot → N zone_coverages)
    max_capacity     INT          NOT NULL DEFAULT 0,          -- Capacidad máxima de reservas para esta zona en este turno
    boundary         GEOMETRY(POLYGON, 4326) NULL,             -- Polígono geográfico de la zona (GeoJSON → PostGIS)
    location         GEOMETRY(POINT, 4326) NULL,               -- Punto representativo / centroide de la zona
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_zone_max_capacity_positive
        CHECK (max_capacity >= 0),
    CONSTRAINT fk_zone_coverage_comuna
        FOREIGN KEY (comuna_id) REFERENCES app.comuna(id)
            ON DELETE SET NULL
);

COMMENT ON COLUMN app.zone_coverage.max_capacity IS 'Capacidad máxima de reservas por turno en esta zona. La suma de todas las max_capacity de las zone_coverages de un delivery_slot determina el max_capacity del delivery_slot.';
COMMENT ON COLUMN app.zone_coverage.boundary IS 'Polígono geográfico de la zona en SRID 4326 (WGS84). Se almacena desde GeoJSON del frontend con ST_GeomFromGeoJSON().';
COMMENT ON COLUMN app.zone_coverage.location IS 'Punto representativo o centroide de la zona. Útil para búsquedas rápidas y visualización en mapa.';

-- ============================================================
-- 4. BLOQUES HORARIOS PLANTILLA (definiciones reutilizables
--    de franjas horarias: 4pm-6pm, 5pm-7pm, etc.)
-- ============================================================
CREATE TABLE app.time_slot_template (
    id          BIGSERIAL   PRIMARY KEY,
    start_time  TIME        NOT NULL,                          -- Ej: '16:00:00'
    end_time    TIME        NOT NULL,                          -- Ej: '18:00:00'
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_time_slot_template UNIQUE (start_time, end_time),
    CONSTRAINT chk_time_range CHECK (start_time < end_time)
);

-- ============================================================
-- 5. VENTANAS DE DESPACHO (instancia concreta: fecha +
--    bloque horario + capacidad + costo)
--    Esta es la entidad central del sistema.
--    Un delivery_slot puede tener N zone_coverages (1:N).
-- ============================================================
CREATE TABLE app.delivery_slot (
    id                    BIGSERIAL     PRIMARY KEY,
    time_slot_template_id BIGINT        NOT NULL,
    delivery_date         DATE          NOT NULL,              -- Fecha de entrega
    delivery_cost         NUMERIC(10,2) NOT NULL,              -- Costo del despacho (ej: 2990)
    max_capacity          INT           NOT NULL DEFAULT 0,    -- Calculado: SUM(zone_coverage.max_capacity) de sus zonas asociadas
    reserved_count        INT           NOT NULL DEFAULT 0,    -- Contador de reservas actuales
    is_active             BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_delivery_slot_template
        FOREIGN KEY (time_slot_template_id) REFERENCES app.time_slot_template(id),
    CONSTRAINT uq_delivery_slot
        UNIQUE (delivery_date, time_slot_template_id),
    CONSTRAINT chk_capacity
        CHECK (reserved_count >= 0 AND reserved_count <= max_capacity),
    CONSTRAINT chk_max_capacity_non_negative
        CHECK (max_capacity >= 0)
);

COMMENT ON COLUMN app.delivery_slot.max_capacity IS 'Capacidad máxima total del slot. Se calcula automáticamente como la SUM(zone_coverage.max_capacity) de todas sus zonas asociadas, mediante el trigger fn_sync_slot_max_capacity().';

CREATE INDEX idx_delivery_slot_date
    ON app.delivery_slot (delivery_date, is_active);

-- ============================================================
-- 5b. FK DIFERIDA: zone_coverage → delivery_slot
--     Una zone_coverage pertenece a un solo delivery_slot.
--     Un delivery_slot puede tener N zone_coverages asociadas.
-- ============================================================
ALTER TABLE app.zone_coverage
    ADD CONSTRAINT fk_zone_coverage_delivery_slot
        FOREIGN KEY (delivery_slot_id) REFERENCES app.delivery_slot(id)
            ON DELETE SET NULL;

CREATE INDEX idx_zone_coverage_delivery_slot
    ON app.zone_coverage (delivery_slot_id);

CREATE INDEX idx_zone_coverage_commune
    ON app.zone_coverage (commune, locality);

CREATE INDEX idx_zone_coverage_comuna
    ON app.zone_coverage (comuna_id);

-- Índices espaciales GiST
CREATE INDEX idx_zone_coverage_boundary_gist
    ON app.zone_coverage USING GIST (boundary);

CREATE INDEX idx_zone_coverage_location_gist
    ON app.zone_coverage USING GIST (location);

-- ============================================================
-- 6. TIPO ENUM para tipos de cliente
-- ============================================================
CREATE TYPE app.customer_type AS ENUM ('ADMIN', 'BUYER');

-- ============================================================
-- 6b. CLIENTES
-- ============================================================
CREATE TABLE app.customer (
    id          BIGSERIAL    PRIMARY KEY,
    full_name   VARCHAR(200) NOT NULL,
    email       VARCHAR(200) NOT NULL,
    phone       VARCHAR(30)  NULL,
    type        app.customer_type NOT NULL DEFAULT 'BUYER',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_customer_email UNIQUE (email)
);

-- ============================================================
-- 4b. SESIONES ACTIVAS DE CLIENTE (vigencia 5 minutos)
-- ============================================================
CREATE TABLE app.active_session (
    id          BIGSERIAL   PRIMARY KEY,
    customer_id BIGINT      NOT NULL,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL,
    ended_at    TIMESTAMPTZ NULL,

    CONSTRAINT fk_active_session_customer
        FOREIGN KEY (customer_id) REFERENCES app.customer(id)
            ON DELETE CASCADE,
    CONSTRAINT chk_active_session_valid_range
        CHECK (expires_at > started_at)
);

CREATE INDEX idx_active_session_customer
    ON app.active_session (customer_id, started_at DESC);

CREATE INDEX idx_active_session_expires_at
    ON app.active_session (expires_at);

-- ============================================================
-- 7. DIRECCIONES DE ENTREGA (un cliente puede tener múltiples)
-- ============================================================
CREATE TABLE app.delivery_address (
    id               BIGSERIAL    PRIMARY KEY,
    customer_id      BIGINT       NOT NULL,
    zone_coverage_id BIGINT       NULL,                            -- FK a zone_coverage (1 zone_coverage → N delivery_addresses)
    comuna_id        BIGINT       NULL,                            -- FK a comuna (división administrativa)
    street           VARCHAR(200) NOT NULL,                        -- Ej: "Monjitas 2334"
    locality         VARCHAR(150) NOT NULL,                        -- Localidad
    commune          VARCHAR(100) NOT NULL,                        -- Ej: "La Serena"
    region           VARCHAR(100) NOT NULL,                        -- Ej: "Coquimbo"
    postal_code      VARCHAR(20)  NULL,
    location         GEOMETRY(POINT, 4326) NULL,                   -- Coordenadas geográficas de la dirección
    is_default       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_delivery_address_customer
        FOREIGN KEY (customer_id) REFERENCES app.customer(id)
            ON DELETE CASCADE,
    CONSTRAINT fk_delivery_address_zone_coverage
        FOREIGN KEY (zone_coverage_id) REFERENCES app.zone_coverage(id)
            ON DELETE SET NULL,
    CONSTRAINT fk_delivery_address_comuna
        FOREIGN KEY (comuna_id) REFERENCES app.comuna(id)
            ON DELETE SET NULL
);

COMMENT ON COLUMN app.delivery_address.zone_coverage_id IS 'Zona de cobertura a la que pertenece esta dirección. Se puede calcular geoespacialmente con ST_Intersects(boundary, location) o asignar manualmente. NULL si la dirección aún no ha sido asignada a una zona.';

CREATE INDEX idx_delivery_address_customer
    ON app.delivery_address (customer_id);

CREATE INDEX idx_delivery_address_zone_coverage
    ON app.delivery_address (zone_coverage_id);

CREATE INDEX idx_delivery_address_commune
    ON app.delivery_address (commune, locality);

CREATE INDEX idx_delivery_address_comuna
    ON app.delivery_address (comuna_id);

-- Índice espacial GiST sobre el punto de la dirección
CREATE INDEX idx_delivery_address_location_gist
    ON app.delivery_address USING GIST (location);

-- ============================================================
-- 8. RESERVAS (una orden reserva exactamente una ventana de despacho)
--    La reserva se asocia directamente al delivery_slot.
-- ============================================================
CREATE TABLE app.reservation (
    id                  BIGSERIAL          PRIMARY KEY,
    customer_id         BIGINT             NOT NULL,
    delivery_address_id BIGINT             NOT NULL,
    delivery_slot_id    BIGINT             NOT NULL,              -- FK a delivery_slot (1 delivery_slot → N reservations)
    status              app.reservation_status NOT NULL DEFAULT 'CONFIRMED',
    reserved_at         TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    cancelled_at        TIMESTAMPTZ        NULL,
    version             INT                NOT NULL DEFAULT 0,     -- Optimistic locking

    CONSTRAINT fk_reservation_customer
        FOREIGN KEY (customer_id) REFERENCES app.customer(id),
    CONSTRAINT fk_reservation_address
        FOREIGN KEY (delivery_address_id) REFERENCES app.delivery_address(id),
    CONSTRAINT fk_reservation_slot
        FOREIGN KEY (delivery_slot_id) REFERENCES app.delivery_slot(id)
);

CREATE INDEX idx_reservation_slot
    ON app.reservation (delivery_slot_id, status);

CREATE INDEX idx_reservation_customer
    ON app.reservation (customer_id, status);

-- ============================================================
-- 9. FUNCIÓN TRIGGER: actualizar updated_at automáticamente
--    (reemplaza ON UPDATE CURRENT_TIMESTAMP de MySQL)
-- ============================================================
CREATE OR REPLACE FUNCTION app.fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_zone_coverage_updated_at
    BEFORE UPDATE ON app.zone_coverage
    FOR EACH ROW EXECUTE FUNCTION app.fn_update_timestamp();

CREATE TRIGGER trg_delivery_slot_updated_at
    BEFORE UPDATE ON app.delivery_slot
    FOR EACH ROW EXECUTE FUNCTION app.fn_update_timestamp();

-- ============================================================
-- 9b. TRIGGER: sincronizar delivery_slot.max_capacity
--     cada vez que se inserta, actualiza o elimina una zone_coverage.
--
--     delivery_slot.max_capacity = SUM(zone_coverage.max_capacity)
--     de todas las zone_coverages asociadas a ese slot.
-- ============================================================
CREATE OR REPLACE FUNCTION app.fn_sync_slot_max_capacity()
RETURNS TRIGGER AS $$
DECLARE
    v_slot_id BIGINT;
    v_new_max INT;
BEGIN
    -- Determinar qué delivery_slot_id hay que recalcular
    IF TG_OP = 'DELETE' THEN
        v_slot_id := OLD.delivery_slot_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Si cambió el delivery_slot_id, recalcular ambos (viejo y nuevo)
        IF OLD.delivery_slot_id IS DISTINCT FROM NEW.delivery_slot_id THEN
            -- Recalcular el slot antiguo
            IF OLD.delivery_slot_id IS NOT NULL THEN
                SELECT COALESCE(SUM(zc.max_capacity), 0) INTO v_new_max
                FROM app.zone_coverage zc
                WHERE zc.delivery_slot_id = OLD.delivery_slot_id;

                UPDATE app.delivery_slot
                SET max_capacity = v_new_max
                WHERE id = OLD.delivery_slot_id;
            END IF;
        END IF;
        v_slot_id := NEW.delivery_slot_id;
    ELSE -- INSERT
        v_slot_id := NEW.delivery_slot_id;
    END IF;

    -- Recalcular el slot actual/nuevo
    IF v_slot_id IS NOT NULL THEN
        SELECT COALESCE(SUM(zc.max_capacity), 0) INTO v_new_max
        FROM app.zone_coverage zc
        WHERE zc.delivery_slot_id = v_slot_id;

        UPDATE app.delivery_slot
        SET max_capacity = v_new_max
        WHERE id = v_slot_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION app.fn_sync_slot_max_capacity() IS 'Recalcula delivery_slot.max_capacity como SUM(zone_coverage.max_capacity) cada vez que se modifica una zona asociada.';

CREATE TRIGGER trg_zone_coverage_sync_capacity
    AFTER INSERT OR UPDATE OF max_capacity, delivery_slot_id OR DELETE
    ON app.zone_coverage
    FOR EACH ROW EXECUTE FUNCTION app.fn_sync_slot_max_capacity();

-- ============================================================
-- DIAGRAMA DE RELACIONES (resumen)
-- ============================================================
--
--  time_slot_template ──1:N── delivery_slot ──1:N── zone_coverage ──1:N── delivery_address
--                                │1                                           │N
--                                │                                            │
--                                N                                            1
--                           reservation ──────────────────────────N:1──── customer
--                                │N
--                                │
--                                1
--                         delivery_address
--
-- Regla de negocio:
--   delivery_slot.max_capacity = SUM(zone_coverage.max_capacity)
--   Se sincroniza automáticamente mediante trigger fn_sync_slot_max_capacity()
--
-- Columnas geoespaciales (PostGIS):
--   zone_coverage.boundary     → GEOMETRY(POLYGON, 4326)  Polígono de la zona
--   zone_coverage.location     → GEOMETRY(POINT, 4326)    Punto representativo / centroide
--   delivery_address.location  → GEOMETRY(POINT, 4326)    Coordenadas de la dirección
--
-- División político-administrativa:
--   region         1 ── N  ciudad            (una región tiene N ciudades/provincias)
--   ciudad         1 ── N  comuna            (una ciudad tiene N comunas)
--   comuna         1 ── N  zone_coverage     (una comuna puede tener N zonas de cobertura)
--   comuna         1 ── N  delivery_address  (una comuna puede tener N direcciones)
--
-- Cardinalidades:
--   time_slot_tmpl 1 ── N  delivery_slot     (un bloque horario se usa en N slots)
--   delivery_slot  1 ── N  zone_coverage     (un slot cubre N zonas, una zona pertenece a 1 slot)
--   delivery_slot  1 ── N  reservation       (un slot tiene N reservas, una reserva pertenece a 1 slot)
--   zone_coverage  1 ── N  delivery_address  (una zona tiene N direcciones, una dirección pertenece a 1 zona)
--   customer       1 ── N  reservation       (un cliente hace N reservas)
--   customer       1 ── N  delivery_address  (un cliente tiene N direcciones)
--   delivery_addr  1 ── N  reservation       (una dirección se usa en N reservas)
--
-- ============================================================

-- ============================================================
-- DATOS DE EJEMPLO
-- ============================================================

-- ============================================================
-- DATOS DE REGIONES, CIUDADES Y COMUNAS DE CHILE
-- ============================================================

-- 16 Regiones de Chile
INSERT INTO app.region (name, ordinal, abbreviation) VALUES
    ('Arica y Parinacota', 15, 'XV'),
    ('Tarapacá', 1, 'I'),
    ('Antofagasta', 2, 'II'),
    ('Atacama', 3, 'III'),
    ('Coquimbo', 4, 'IV'),
    ('Valparaíso', 5, 'V'),
    ('Metropolitana de Santiago', 13, 'RM'),
    ('O''Higgins', 6, 'VI'),
    ('Maule', 7, 'VII'),
    ('Ñuble', 16, 'XVI'),
    ('Biobío', 8, 'VIII'),
    ('La Araucanía', 9, 'IX'),
    ('Los Ríos', 14, 'XIV'),
    ('Los Lagos', 10, 'X'),
    ('Aysén', 11, 'XI'),
    ('Magallanes y la Antártica Chilena', 12, 'XII');

-- ============================================================
-- CIUDADES (provincias principales) Y COMUNAS POR REGIÓN
-- ============================================================

-- Región de Arica y Parinacota (id=1)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Arica', 1),
    ('Parinacota', 1);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Arica', 1),
    ('Camarones', 1),
    ('Putre', 2),
    ('General Lagos', 2);

-- Región de Tarapacá (id=2)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Iquique', 2),
    ('Tamarugal', 2);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Iquique', 3),
    ('Alto Hospicio', 3),
    ('Pozo Almonte', 4),
    ('Camiña', 4),
    ('Colchane', 4),
    ('Huara', 4),
    ('Pica', 4);

-- Región de Antofagasta (id=3)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Antofagasta', 3),
    ('El Loa', 3),
    ('Tocopilla', 3);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Antofagasta', 5),
    ('Mejillones', 5),
    ('Sierra Gorda', 5),
    ('Taltal', 5),
    ('Calama', 6),
    ('Ollagüe', 6),
    ('San Pedro de Atacama', 6),
    ('Tocopilla', 7),
    ('María Elena', 7);

-- Región de Atacama (id=4)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Copiapó', 4),
    ('Chañaral', 4),
    ('Huasco', 4);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Copiapó', 8),
    ('Caldera', 8),
    ('Tierra Amarilla', 8),
    ('Chañaral', 9),
    ('Diego de Almagro', 9),
    ('Vallenar', 10),
    ('Alto del Carmen', 10),
    ('Freirina', 10),
    ('Huasco', 10);

-- Región de Coquimbo (id=5)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Elqui', 5),
    ('Choapa', 5),
    ('Limarí', 5);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('La Serena', 11),
    ('Coquimbo', 11),
    ('Andacollo', 11),
    ('La Higuera', 11),
    ('Paiguano', 11),
    ('Vicuña', 11),
    ('Illapel', 12),
    ('Canela', 12),
    ('Los Vilos', 12),
    ('Salamanca', 12),
    ('Ovalle', 13),
    ('Combarbalá', 13),
    ('Monte Patria', 13),
    ('Punitaqui', 13),
    ('Río Hurtado', 13);

-- Región de Valparaíso (id=6)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Valparaíso', 6),
    ('Isla de Pascua', 6),
    ('Los Andes', 6),
    ('Petorca', 6),
    ('Quillota', 6),
    ('San Antonio', 6),
    ('San Felipe de Aconcagua', 6),
    ('Marga Marga', 6);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Valparaíso', 14),
    ('Casablanca', 14),
    ('Concón', 14),
    ('Juan Fernández', 14),
    ('Puchuncaví', 14),
    ('Quintero', 14),
    ('Viña del Mar', 14),
    ('Isla de Pascua', 15),
    ('Los Andes', 16),
    ('Calle Larga', 16),
    ('Rinconada', 16),
    ('San Esteban', 16),
    ('La Ligua', 17),
    ('Cabildo', 17),
    ('Papudo', 17),
    ('Petorca', 17),
    ('Zapallar', 17),
    ('Quillota', 18),
    ('Calera', 18),
    ('Hijuelas', 18),
    ('La Cruz', 18),
    ('Nogales', 18),
    ('San Antonio', 19),
    ('Algarrobo', 19),
    ('Cartagena', 19),
    ('El Quisco', 19),
    ('El Tabo', 19),
    ('Santo Domingo', 19),
    ('San Felipe', 20),
    ('Catemu', 20),
    ('Llaillay', 20),
    ('Panquehue', 20),
    ('Putaendo', 20),
    ('Santa María', 20),
    ('Quilpué', 21),
    ('Limache', 21),
    ('Olmué', 21),
    ('Villa Alemana', 21);

-- Región Metropolitana de Santiago (id=7)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Santiago', 7),
    ('Cordillera', 7),
    ('Chacabuco', 7),
    ('Maipo', 7),
    ('Melipilla', 7),
    ('Talagante', 7);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Santiago', 22),
    ('Cerrillos', 22),
    ('Cerro Navia', 22),
    ('Conchalí', 22),
    ('El Bosque', 22),
    ('Estación Central', 22),
    ('Huechuraba', 22),
    ('Independencia', 22),
    ('La Cisterna', 22),
    ('La Florida', 22),
    ('La Granja', 22),
    ('La Pintana', 22),
    ('La Reina', 22),
    ('Las Condes', 22),
    ('Lo Barnechea', 22),
    ('Lo Espejo', 22),
    ('Lo Prado', 22),
    ('Macul', 22),
    ('Maipú', 22),
    ('Ñuñoa', 22),
    ('Pedro Aguirre Cerda', 22),
    ('Peñalolén', 22),
    ('Providencia', 22),
    ('Pudahuel', 22),
    ('Quilicura', 22),
    ('Quinta Normal', 22),
    ('Recoleta', 22),
    ('Renca', 22),
    ('San Joaquín', 22),
    ('San Miguel', 22),
    ('San Ramón', 22),
    ('Vitacura', 22),
    ('Puente Alto', 23),
    ('Pirque', 23),
    ('San José de Maipo', 23),
    ('Colina', 24),
    ('Lampa', 24),
    ('Tiltil', 24),
    ('San Bernardo', 25),
    ('Buin', 25),
    ('Calera de Tango', 25),
    ('Paine', 25),
    ('Melipilla', 26),
    ('Alhué', 26),
    ('Curacaví', 26),
    ('María Pinto', 26),
    ('San Pedro', 26),
    ('Talagante', 27),
    ('El Monte', 27),
    ('Isla de Maipo', 27),
    ('Padre Hurtado', 27),
    ('Peñaflor', 27);

-- Región de O'Higgins (id=8)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Cachapoal', 8),
    ('Cardenal Caro', 8),
    ('Colchagua', 8);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Rancagua', 28),
    ('Codegua', 28),
    ('Coinco', 28),
    ('Coltauco', 28),
    ('Doñihue', 28),
    ('Graneros', 28),
    ('Las Cabras', 28),
    ('Machalí', 28),
    ('Malloa', 28),
    ('Mostazal', 28),
    ('Olivar', 28),
    ('Peumo', 28),
    ('Pichidegua', 28),
    ('Quinta de Tilcoco', 28),
    ('Rengo', 28),
    ('Requínoa', 28),
    ('San Vicente', 28),
    ('Pichilemu', 29),
    ('La Estrella', 29),
    ('Litueche', 29),
    ('Marchihue', 29),
    ('Navidad', 29),
    ('Paredones', 29),
    ('San Fernando', 30),
    ('Chépica', 30),
    ('Chimbarongo', 30),
    ('Lolol', 30),
    ('Nancagua', 30),
    ('Palmilla', 30),
    ('Peralillo', 30),
    ('Placilla', 30),
    ('Pumanque', 30),
    ('Santa Cruz', 30);

-- Región del Maule (id=9)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Talca', 9),
    ('Cauquenes', 9),
    ('Curicó', 9),
    ('Linares', 9);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Talca', 31),
    ('Constitución', 31),
    ('Curepto', 31),
    ('Empedrado', 31),
    ('Maule', 31),
    ('Pelarco', 31),
    ('Pencahue', 31),
    ('Río Claro', 31),
    ('San Clemente', 31),
    ('San Rafael', 31),
    ('Cauquenes', 32),
    ('Chanco', 32),
    ('Pelluhue', 32),
    ('Curicó', 33),
    ('Hualañé', 33),
    ('Licantén', 33),
    ('Molina', 33),
    ('Rauco', 33),
    ('Romeral', 33),
    ('Sagrada Familia', 33),
    ('Teno', 33),
    ('Vichuquén', 33),
    ('Linares', 34),
    ('Colbún', 34),
    ('Longaví', 34),
    ('Parral', 34),
    ('Retiro', 34),
    ('San Javier', 34),
    ('Villa Alegre', 34),
    ('Yerbas Buenas', 34);

-- Región de Ñuble (id=10)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Diguillín', 10),
    ('Itata', 10),
    ('Punilla', 10);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Chillán', 35),
    ('Bulnes', 35),
    ('Chillán Viejo', 35),
    ('El Carmen', 35),
    ('Pemuco', 35),
    ('Pinto', 35),
    ('Quillón', 35),
    ('San Ignacio', 35),
    ('Yungay', 35),
    ('Cobquecura', 36),
    ('Coelemu', 36),
    ('Ninhue', 36),
    ('Portezuelo', 36),
    ('Quirihue', 36),
    ('Ránquil', 36),
    ('Treguaco', 36),
    ('Coihueco', 37),
    ('Ñiquén', 37),
    ('San Carlos', 37),
    ('San Fabián', 37),
    ('San Nicolás', 37);

-- Región del Biobío (id=11)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Concepción', 11),
    ('Arauco', 11),
    ('Biobío', 11);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Concepción', 38),
    ('Coronel', 38),
    ('Chiguayante', 38),
    ('Florida', 38),
    ('Hualqui', 38),
    ('Lota', 38),
    ('Penco', 38),
    ('San Pedro de la Paz', 38),
    ('Santa Juana', 38),
    ('Talcahuano', 38),
    ('Tomé', 38),
    ('Hualpén', 38),
    ('Lebu', 39),
    ('Arauco', 39),
    ('Cañete', 39),
    ('Contulmo', 39),
    ('Curanilahue', 39),
    ('Los Álamos', 39),
    ('Tirúa', 39),
    ('Los Ángeles', 40),
    ('Antuco', 40),
    ('Cabrero', 40),
    ('Laja', 40),
    ('Mulchén', 40),
    ('Nacimiento', 40),
    ('Negrete', 40),
    ('Quilaco', 40),
    ('Quilleco', 40),
    ('San Rosendo', 40),
    ('Santa Bárbara', 40),
    ('Tucapel', 40),
    ('Yumbel', 40),
    ('Alto Biobío', 40);

-- Región de La Araucanía (id=12)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Cautín', 12),
    ('Malleco', 12);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Temuco', 41),
    ('Carahue', 41),
    ('Cunco', 41),
    ('Curarrehue', 41),
    ('Freire', 41),
    ('Galvarino', 41),
    ('Gorbea', 41),
    ('Lautaro', 41),
    ('Loncoche', 41),
    ('Melipeuco', 41),
    ('Nueva Imperial', 41),
    ('Padre Las Casas', 41),
    ('Perquenco', 41),
    ('Pitrufquén', 41),
    ('Pucón', 41),
    ('Saavedra', 41),
    ('Teodoro Schmidt', 41),
    ('Toltén', 41),
    ('Vilcún', 41),
    ('Villarrica', 41),
    ('Cholchol', 41),
    ('Angol', 42),
    ('Collipulli', 42),
    ('Curacautín', 42),
    ('Ercilla', 42),
    ('Lonquimay', 42),
    ('Los Sauces', 42),
    ('Lumaco', 42),
    ('Purén', 42),
    ('Renaico', 42),
    ('Traiguén', 42),
    ('Victoria', 42);

-- Región de Los Ríos (id=13)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Valdivia', 13),
    ('Ranco', 13);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Valdivia', 43),
    ('Corral', 43),
    ('Lanco', 43),
    ('Los Lagos', 43),
    ('Máfil', 43),
    ('Mariquina', 43),
    ('Paillaco', 43),
    ('Panguipulli', 43),
    ('La Unión', 44),
    ('Futrono', 44),
    ('Lago Ranco', 44),
    ('Río Bueno', 44);

-- Región de Los Lagos (id=14)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Llanquihue', 14),
    ('Chiloé', 14),
    ('Osorno', 14),
    ('Palena', 14);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Puerto Montt', 45),
    ('Calbuco', 45),
    ('Cochamó', 45),
    ('Fresia', 45),
    ('Frutillar', 45),
    ('Los Muermos', 45),
    ('Llanquihue', 45),
    ('Maullín', 45),
    ('Puerto Varas', 45),
    ('Castro', 46),
    ('Ancud', 46),
    ('Chonchi', 46),
    ('Curaco de Vélez', 46),
    ('Dalcahue', 46),
    ('Puqueldón', 46),
    ('Queilén', 46),
    ('Quellón', 46),
    ('Quemchi', 46),
    ('Quinchao', 46),
    ('Osorno', 47),
    ('Entre Lagos', 47),
    ('Purranque', 47),
    ('Puerto Octay', 47),
    ('Puyehue', 47),
    ('Río Negro', 47),
    ('San Juan de la Costa', 47),
    ('San Pablo', 47),
    ('Chaitén', 48),
    ('Futaleufú', 48),
    ('Hualaihué', 48),
    ('Palena', 48);

-- Región de Aysén (id=15)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Coyhaique', 15),
    ('Aysén', 15),
    ('Capitán Prat', 15),
    ('General Carrera', 15);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Coyhaique', 49),
    ('Lago Verde', 49),
    ('Aysén', 50),
    ('Cisnes', 50),
    ('Guaitecas', 50),
    ('Cochrane', 51),
    ('O''Higgins', 51),
    ('Tortel', 51),
    ('Chile Chico', 52),
    ('Río Ibáñez', 52);

-- Región de Magallanes y la Antártica Chilena (id=16)
INSERT INTO app.ciudad (name, region_id) VALUES
    ('Magallanes', 16),
    ('Antártica Chilena', 16),
    ('Tierra del Fuego', 16),
    ('Última Esperanza', 16);

INSERT INTO app.comuna (name, ciudad_id) VALUES
    ('Punta Arenas', 53),
    ('Laguna Blanca', 53),
    ('Río Verde', 53),
    ('San Gregorio', 53),
    ('Cabo de Hornos', 54),
    ('Antártica', 54),
    ('Porvenir', 55),
    ('Primavera', 55),
    ('Timaukel', 55),
    ('Natales', 56),
    ('Torres del Paine', 56);

-- ============================================================
-- DATOS DE EJEMPLO
-- ============================================================

-- Plantillas de bloques horarios
INSERT INTO time_slot_template (start_time, end_time) VALUES
    ('10:00:00', '12:00:00'),  -- id=1
    ('12:00:00', '14:00:00'),  -- id=2
    ('14:00:00', '16:00:00'),  -- id=3
    ('16:00:00', '18:00:00'),  -- id=4
    ('17:00:00', '19:00:00'),  -- id=5
    ('18:00:00', '20:00:00'),  -- id=6
    ('19:00:00', '21:00:00');  -- id=7

-- Ventanas de despacho (max_capacity inicia en 0, el trigger lo calcula
-- automáticamente al insertar las zone_coverages asociadas)
INSERT INTO delivery_slot (time_slot_template_id, delivery_date, delivery_cost) VALUES
    (4, '2026-01-27', 2990.00),  -- id=1  16:00-18:00
    (5, '2026-01-27', 2990.00),  -- id=2  17:00-19:00
    (6, '2026-01-27', 2990.00),  -- id=3  18:00-20:00
    (7, '2026-01-27', 2990.00),  -- id=4  19:00-21:00
    (4, '2026-01-28', 2990.00),  -- id=5  16:00-18:00
    (5, '2026-01-28', 2990.00),  -- id=6  17:00-19:00
    (4, '2026-02-02', 2990.00);  -- id=7  16:00-18:00 (se marcará AGOTADO después)

-- Zonas de cobertura con capacidad máxima por zona (GeoJSON → PostGIS)
-- Slot id=1 (27/01 16-18h): 3 zonas → max_capacity = 8 + 5 + 7 = 20
-- Slot id=2 (27/01 17-19h): 1 zona  → max_capacity = 15
-- Slot id=5 (28/01 16-18h): 1 zona  → max_capacity = 25
-- Slot id=7 (02/02 16-18h): 1 zona  → max_capacity = 10 (se agotará)
--
-- El trigger fn_sync_slot_max_capacity() actualiza delivery_slot.max_capacity
-- automáticamente al insertar cada zone_coverage.
INSERT INTO zone_coverage (name, commune, region, locality, delivery_slot_id, max_capacity, boundary, location) VALUES
    (
        'La Serena Centro', 'La Serena', 'Coquimbo', 'Monjitas', 1, 8,
        ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-71.260,-29.915],[-71.240,-29.915],[-71.240,-29.900],[-71.260,-29.900],[-71.260,-29.915]]]}'),
        ST_SetSRID(ST_MakePoint(-71.250, -29.907), 4326)
    ),
    (
        'La Serena Av. del Mar', 'La Serena', 'Coquimbo', 'Av. del Mar', 1, 5,
        ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-71.265,-29.920],[-71.245,-29.920],[-71.245,-29.905],[-71.265,-29.905],[-71.265,-29.920]]]}'),
        ST_SetSRID(ST_MakePoint(-71.248, -29.910), 4326)
    ),
    (
        'Coquimbo Puerto', 'Coquimbo', 'Coquimbo', 'Barrio Inglés', 1, 7,
        ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-71.350,-29.960],[-71.330,-29.960],[-71.330,-29.945],[-71.350,-29.945],[-71.350,-29.960]]]}'),
        ST_SetSRID(ST_MakePoint(-71.340, -29.953), 4326)
    ),
    (
        'La Serena Centro', 'La Serena', 'Coquimbo', 'Monjitas', 2, 15,
        ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-71.260,-29.915],[-71.240,-29.915],[-71.240,-29.900],[-71.260,-29.900],[-71.260,-29.915]]]}'),
        ST_SetSRID(ST_MakePoint(-71.250, -29.907), 4326)
    ),
    (
        'Santiago Centro', 'Santiago', 'Metropolitana', 'Alameda', 5, 25,
        ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-70.670,-33.460],[-70.640,-33.460],[-70.640,-33.430],[-70.670,-33.430],[-70.670,-33.460]]]}'),
        ST_SetSRID(ST_MakePoint(-70.655, -33.445), 4326)
    ),
    (
        'La Serena Centro', 'La Serena', 'Coquimbo', 'Monjitas', 7, 10,
        ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-71.260,-29.915],[-71.240,-29.915],[-71.240,-29.900],[-71.260,-29.900],[-71.260,-29.915]]]}'),
        ST_SetSRID(ST_MakePoint(-71.250, -29.907), 4326)
    );

-- Después de insertar las zonas, el trigger ya calculó:
--   slot 1 → max_capacity = 20  (8+5+7)
--   slot 2 → max_capacity = 15
--   slot 5 → max_capacity = 25
--   slot 7 → max_capacity = 10
-- Marcamos slot 7 como agotado (reserved_count = max_capacity = 10)
UPDATE delivery_slot SET reserved_count = 10 WHERE id = 7;

-- Cliente de ejemplo
INSERT INTO customer (full_name, email, phone, type) VALUES
    ('Pedro Perez', 'pedro.perez@mail.com', '+56912345678', 'BUYER');
INSERT INTO customer (full_name, email, phone, type) VALUES
    ('Maria Gonzalez', 'mgonza@mmmm.cc', '+56987654321', 'ADMIN');

-- Dirección de ejemplo con coordenadas geográficas
-- zone_coverage_id = 1 → "La Serena Centro" (Monjitas) del slot 1
INSERT INTO delivery_address (customer_id, zone_coverage_id, street, locality, commune, region, location, is_default) VALUES
    (
        1,
        1,
        'Monjitas 2334',
        'Monjitas',
        'La Serena',
        'Coquimbo',
        ST_SetSRID(ST_MakePoint(-71.252, -29.907), 4326),
        TRUE
    );

-- ============================================================
-- 10. CONSULTAS GEOESPACIALES DE EJEMPLO
-- ============================================================

-- A) Verificar si una dirección (punto) cae dentro de alguna zona de cobertura
--    Ejemplo: ¿La dirección lng=-71.252, lat=-29.907 pertenece a alguna zona?
--
-- SELECT zc.id, zc.name, zc.commune, zc.locality
-- FROM zone_coverage zc
-- WHERE ST_Intersects(
--     zc.boundary,
--     ST_SetSRID(ST_MakePoint(-71.252, -29.907), 4326)
-- )
-- AND zc.is_active = TRUE;

-- B) Obtener ventanas de despacho disponibles para una dirección
--    Busca las zonas que contienen el punto, con su slot y disponibilidad
--
-- SELECT zc.id AS zone_coverage_id, zc.name AS zone_name,
--        zc.max_capacity AS zone_max_capacity,
--        ds.id AS slot_id, ds.delivery_date, ds.delivery_cost,
--        tst.start_time, tst.end_time,
--        ds.max_capacity - ds.reserved_count AS slot_available
-- FROM zone_coverage zc
-- JOIN delivery_slot ds ON ds.id = zc.delivery_slot_id
-- JOIN time_slot_template tst ON tst.id = ds.time_slot_template_id
-- WHERE ST_Intersects(
--     zc.boundary,
--     ST_SetSRID(ST_MakePoint(-71.252, -29.907), 4326)
-- )
-- AND zc.is_active = TRUE
-- AND ds.is_active = TRUE
-- AND ds.reserved_count < ds.max_capacity
-- AND ds.delivery_date >= CURRENT_DATE
-- ORDER BY ds.delivery_date, tst.start_time;

-- C) Exportar el polígono de una zona como GeoJSON (para enviar al frontend)
--
-- SELECT zc.id, zc.name, zc.commune, zc.locality,
--        ST_AsGeoJSON(zc.boundary) AS boundary_geojson,
--        ST_AsGeoJSON(zc.location) AS location_geojson
-- FROM zone_coverage zc
-- WHERE zc.is_active = TRUE;

-- D) Reservar una ventana con control de concurrencia (SELECT FOR UPDATE)
--    La reserva se hace a nivel de delivery_slot.
--
-- BEGIN;
--   -- 1. Bloquear el delivery_slot para evitar sobre-reservas
--   SELECT id, reserved_count, max_capacity
--   FROM delivery_slot
--   WHERE id = 1 AND reserved_count < max_capacity
--   FOR UPDATE;
--
--   -- 2. Incrementar el contador de reservas del slot
--   UPDATE delivery_slot
--   SET reserved_count = reserved_count + 1,
--       updated_at = NOW()
--   WHERE id = 1;
--
--   -- 3. Crear la reserva apuntando al delivery_slot
--   INSERT INTO reservation (customer_id, delivery_address_id, delivery_slot_id)
--   VALUES (1, 1, 1);
-- COMMIT;

-- E) Listar todas las zonas de cobertura que tiene un delivery_slot específico
--
-- SELECT zc.id, zc.name, zc.commune, zc.locality, zc.max_capacity,
--        ST_AsGeoJSON(zc.boundary) AS geojson
-- FROM zone_coverage zc
-- WHERE zc.delivery_slot_id = 1
-- AND zc.is_active = TRUE;

-- F) Ver el desglose de capacidad por zona de un delivery_slot
--    y verificar que la suma coincide con delivery_slot.max_capacity
--
-- SELECT ds.id AS slot_id,
--        ds.delivery_date,
--        ds.max_capacity AS slot_max_capacity,
--        ds.reserved_count AS slot_reserved,
--        ds.max_capacity - ds.reserved_count AS slot_available,
--        zc.id AS zone_id,
--        zc.name AS zone_name,
--        zc.max_capacity AS zone_max_capacity
-- FROM delivery_slot ds
-- JOIN zone_coverage zc ON zc.delivery_slot_id = ds.id
-- WHERE ds.id = 1
-- ORDER BY zc.name;

-- G) Obtener las reservas de un cliente con detalle de slot y dirección
--
-- SELECT r.id AS reservation_id, r.status, r.reserved_at,
--        ds.delivery_date, ds.delivery_cost,
--        tst.start_time, tst.end_time,
--        da.street, da.locality AS address_locality,
--        zc.name AS zone_name, zc.commune AS zone_commune
-- FROM reservation r
-- JOIN delivery_slot ds ON ds.id = r.delivery_slot_id
-- JOIN time_slot_template tst ON tst.id = ds.time_slot_template_id
-- JOIN delivery_address da ON da.id = r.delivery_address_id
-- LEFT JOIN zone_coverage zc ON zc.id = da.zone_coverage_id
-- WHERE r.customer_id = 1
-- ORDER BY r.reserved_at DESC;

-- H) Asignar automáticamente una zone_coverage a una delivery_address
--    usando geolocalización (ST_Intersects con el polígono de la zona)
--
-- UPDATE delivery_address da
-- SET zone_coverage_id = (
--     SELECT zc.id
--     FROM zone_coverage zc
--     WHERE ST_Intersects(zc.boundary, da.location)
--     AND zc.is_active = TRUE
--     LIMIT 1
-- )
-- WHERE da.id = :address_id
-- AND da.location IS NOT NULL;

-- I) Listar direcciones de una zona de cobertura específica
--
-- SELECT da.id, da.street, da.locality, da.commune,
--        c.full_name AS customer_name,
--        ST_AsGeoJSON(da.location) AS location_geojson
-- FROM delivery_address da
-- JOIN customer c ON c.id = da.customer_id
-- WHERE da.zone_coverage_id = 1;
