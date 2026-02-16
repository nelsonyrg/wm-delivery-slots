package com.app.demo.config;

import com.app.demo.config.jackson.JtsModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de Jackson para serialización/deserialización
 * de geometrías JTS en formato GeoJSON.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public JtsModule jtsModule() {
        return new JtsModule();
    }
}
