package com.app.demo.config.jackson;

import org.locationtech.jts.geom.*;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.deser.std.StdDeserializer;

import java.util.ArrayList;
import java.util.List;

/**
 * Deserializador de GeoJSON a geometrías JTS.
 * Compatible con Jackson 3.x (tools.jackson) y Spring Boot 4.
 */
public class GeometryDeserializer extends StdDeserializer<Geometry> {

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    public GeometryDeserializer() {
        super(Geometry.class);
    }

    @Override
    public Geometry deserialize(JsonParser parser, DeserializationContext context)
            throws tools.jackson.core.JacksonException {

        String type = null;
        Object coordinatesNode = null;
        List<Geometry> geometries = null;

        while (parser.nextToken() != JsonToken.END_OBJECT) {
            String fieldName = parser.currentName();
            parser.nextToken();

            if ("type".equals(fieldName)) {
                type = parser.getText();
            } else if ("coordinates".equals(fieldName)) {
                coordinatesNode = parseCoordinates(parser);
            } else if ("geometries".equals(fieldName)) {
                geometries = parseGeometries(parser, context);
            } else {
                parser.skipChildren();
            }
        }

        if (type == null) {
            return null;
        }

        return switch (type) {
            case "Point" -> createPoint(coordinatesNode);
            case "MultiPoint" -> createMultiPoint(coordinatesNode);
            case "LineString" -> createLineString(coordinatesNode);
            case "MultiLineString" -> createMultiLineString(coordinatesNode);
            case "Polygon" -> createPolygon(coordinatesNode);
            case "MultiPolygon" -> createMultiPolygon(coordinatesNode);
            case "GeometryCollection" -> createGeometryCollection(geometries);
            default -> null;
        };
    }

    @SuppressWarnings("unchecked")
    private Object parseCoordinates(JsonParser parser) throws tools.jackson.core.JacksonException {
        return parseArray(parser);
    }

    private Object parseArray(JsonParser parser) throws tools.jackson.core.JacksonException {
        List<Object> list = new ArrayList<>();
        while (parser.nextToken() != JsonToken.END_ARRAY) {
            if (parser.currentToken() == JsonToken.START_ARRAY) {
                list.add(parseArray(parser));
            } else {
                list.add(parser.getDoubleValue());
            }
        }
        return list;
    }

    private List<Geometry> parseGeometries(JsonParser parser, DeserializationContext context)
            throws tools.jackson.core.JacksonException {
        List<Geometry> geomList = new ArrayList<>();
        while (parser.nextToken() != JsonToken.END_ARRAY) {
            geomList.add(deserialize(parser, context));
        }
        return geomList;
    }

    @SuppressWarnings("unchecked")
    private Coordinate toCoordinate(Object obj) {
        List<Object> coords = (List<Object>) obj;
        double x = ((Number) coords.get(0)).doubleValue();
        double y = ((Number) coords.get(1)).doubleValue();
        if (coords.size() > 2) {
            double z = ((Number) coords.get(2)).doubleValue();
            return new Coordinate(x, y, z);
        }
        return new Coordinate(x, y);
    }

    @SuppressWarnings("unchecked")
    private Coordinate[] toCoordinateArray(Object obj) {
        List<Object> list = (List<Object>) obj;
        return list.stream().map(this::toCoordinate).toArray(Coordinate[]::new);
    }

    private Point createPoint(Object coords) {
        return GEOMETRY_FACTORY.createPoint(toCoordinate(coords));
    }

    @SuppressWarnings("unchecked")
    private MultiPoint createMultiPoint(Object coords) {
        List<Object> list = (List<Object>) coords;
        Point[] points = list.stream()
                .map(c -> GEOMETRY_FACTORY.createPoint(toCoordinate(c)))
                .toArray(Point[]::new);
        return GEOMETRY_FACTORY.createMultiPoint(points);
    }

    private LineString createLineString(Object coords) {
        return GEOMETRY_FACTORY.createLineString(toCoordinateArray(coords));
    }

    @SuppressWarnings("unchecked")
    private MultiLineString createMultiLineString(Object coords) {
        List<Object> list = (List<Object>) coords;
        LineString[] lines = list.stream()
                .map(c -> GEOMETRY_FACTORY.createLineString(toCoordinateArray(c)))
                .toArray(LineString[]::new);
        return GEOMETRY_FACTORY.createMultiLineString(lines);
    }

    @SuppressWarnings("unchecked")
    private Polygon createPolygon(Object coords) {
        List<Object> rings = (List<Object>) coords;
        LinearRing shell = GEOMETRY_FACTORY.createLinearRing(toCoordinateArray(rings.get(0)));
        LinearRing[] holes = new LinearRing[rings.size() - 1];
        for (int i = 1; i < rings.size(); i++) {
            holes[i - 1] = GEOMETRY_FACTORY.createLinearRing(toCoordinateArray(rings.get(i)));
        }
        return GEOMETRY_FACTORY.createPolygon(shell, holes);
    }

    @SuppressWarnings("unchecked")
    private MultiPolygon createMultiPolygon(Object coords) {
        List<Object> list = (List<Object>) coords;
        Polygon[] polygons = list.stream()
                .map(this::createPolygon)
                .toArray(Polygon[]::new);
        return GEOMETRY_FACTORY.createMultiPolygon(polygons);
    }

    private GeometryCollection createGeometryCollection(List<Geometry> geometries) {
        if (geometries == null) return GEOMETRY_FACTORY.createGeometryCollection();
        return GEOMETRY_FACTORY.createGeometryCollection(geometries.toArray(new Geometry[0]));
    }
}
