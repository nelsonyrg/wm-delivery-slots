package com.app.demo.config.jackson;

import org.locationtech.jts.geom.*;
import tools.jackson.databind.module.SimpleModule;

/**
 * Módulo Jackson 3.x para serializar/deserializar geometrías JTS en formato GeoJSON.
 * Registra serializadores y deserializadores para todos los tipos de geometría JTS.
 */
public class JtsModule extends SimpleModule {

    @SuppressWarnings("unchecked")
    public JtsModule() {
        super("JtsModule");

        // Serializador genérico para todas las geometrías (funciona con herencia)
        addSerializer(Geometry.class, new GeometrySerializer());

        // Deserializador solo para la clase base (Jackson resuelve subtipos)
        addDeserializer(Geometry.class, new GeometryDeserializer());
    }
}
