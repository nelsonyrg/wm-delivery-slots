package com.app.demo.config.jackson;

import org.locationtech.jts.geom.*;
import tools.jackson.core.JsonGenerator;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ser.std.StdSerializer;

/**
 * Serializador de geometrías JTS a formato GeoJSON.
 * Compatible con Jackson 3.x (tools.jackson) y Spring Boot 4.
 */
public class GeometrySerializer extends StdSerializer<Geometry> {

    public GeometrySerializer() {
        super(Geometry.class);
    }

    @Override
    public void serialize(Geometry geometry, JsonGenerator gen, SerializationContext ctxt)
            throws tools.jackson.core.JacksonException {
        if (geometry == null) {
            gen.writeNull();
            return;
        }
        writeGeometry(geometry, gen);
    }

    private void writeGeometry(Geometry geometry, JsonGenerator gen)
            throws tools.jackson.core.JacksonException {
        gen.writeStartObject();

        if (geometry instanceof Point point) {
            writePoint(point, gen);
        } else if (geometry instanceof MultiPoint multiPoint) {
            writeMultiPoint(multiPoint, gen);
        } else if (geometry instanceof LineString lineString) {
            writeLineString(lineString, gen);
        } else if (geometry instanceof MultiLineString multiLineString) {
            writeMultiLineString(multiLineString, gen);
        } else if (geometry instanceof Polygon polygon) {
            writePolygon(polygon, gen);
        } else if (geometry instanceof MultiPolygon multiPolygon) {
            writeMultiPolygon(multiPolygon, gen);
        } else if (geometry instanceof GeometryCollection collection) {
            writeGeometryCollection(collection, gen);
        }

        gen.writeEndObject();
    }

    private void writePoint(Point point, JsonGenerator gen)
            throws tools.jackson.core.JacksonException {
        gen.writeStringProperty("type", "Point");
        gen.writeName("coordinates");
        writeCoordinate(point.getCoordinate(), gen);
    }

    private void writeMultiPoint(MultiPoint multiPoint, JsonGenerator gen)
            throws tools.jackson.core.JacksonException {
        gen.writeStringProperty("type", "MultiPoint");
        gen.writeName("coordinates");
        writeCoordinateArray(multiPoint.getCoordinates(), gen);
    }

    private void writeLineString(LineString lineString, JsonGenerator gen)
            throws tools.jackson.core.JacksonException {
        gen.writeStringProperty("type", "LineString");
        gen.writeName("coordinates");
        writeCoordinateArray(lineString.getCoordinates(), gen);
    }

    private void writeMultiLineString(MultiLineString multiLineString, JsonGenerator gen)
            throws tools.jackson.core.JacksonException {
        gen.writeStringProperty("type", "MultiLineString");
        gen.writeName("coordinates");
        gen.writeStartArray();
        for (int i = 0; i < multiLineString.getNumGeometries(); i++) {
            writeCoordinateArray(multiLineString.getGeometryN(i).getCoordinates(), gen);
        }
        gen.writeEndArray();
    }

    private void writePolygon(Polygon polygon, JsonGenerator gen)
            throws tools.jackson.core.JacksonException {
        gen.writeStringProperty("type", "Polygon");
        gen.writeName("coordinates");
        writePolygonCoordinates(polygon, gen);
    }

    private void writeMultiPolygon(MultiPolygon multiPolygon, JsonGenerator gen)
            throws tools.jackson.core.JacksonException {
        gen.writeStringProperty("type", "MultiPolygon");
        gen.writeName("coordinates");
        gen.writeStartArray();
        for (int i = 0; i < multiPolygon.getNumGeometries(); i++) {
            writePolygonCoordinates((Polygon) multiPolygon.getGeometryN(i), gen);
        }
        gen.writeEndArray();
    }

    private void writeGeometryCollection(GeometryCollection collection, JsonGenerator gen)
            throws tools.jackson.core.JacksonException {
        gen.writeStringProperty("type", "GeometryCollection");
        gen.writeName("geometries");
        gen.writeStartArray();
        for (int i = 0; i < collection.getNumGeometries(); i++) {
            writeGeometry(collection.getGeometryN(i), gen);
        }
        gen.writeEndArray();
    }

    private void writePolygonCoordinates(Polygon polygon, JsonGenerator gen)
            throws tools.jackson.core.JacksonException {
        gen.writeStartArray();
        writeCoordinateArray(polygon.getExteriorRing().getCoordinates(), gen);
        for (int i = 0; i < polygon.getNumInteriorRing(); i++) {
            writeCoordinateArray(polygon.getInteriorRingN(i).getCoordinates(), gen);
        }
        gen.writeEndArray();
    }

    private void writeCoordinate(Coordinate coordinate, JsonGenerator gen)
            throws tools.jackson.core.JacksonException {
        gen.writeStartArray();
        gen.writeNumber(coordinate.x);
        gen.writeNumber(coordinate.y);
        if (!Double.isNaN(coordinate.getZ())) {
            gen.writeNumber(coordinate.getZ());
        }
        gen.writeEndArray();
    }

    private void writeCoordinateArray(Coordinate[] coordinates, JsonGenerator gen)
            throws tools.jackson.core.JacksonException {
        gen.writeStartArray();
        for (Coordinate coord : coordinates) {
            writeCoordinate(coord, gen);
        }
        gen.writeEndArray();
    }
}
