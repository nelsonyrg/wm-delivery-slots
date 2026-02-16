package com.app.demo.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        String dbStatus;
        String postgisVersion;

        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            dbStatus = "Conectado";
        } catch (Exception e) {
            dbStatus = "Error: " + e.getMessage();
        }

        try {
            postgisVersion = jdbcTemplate.queryForObject("SELECT PostGIS_Version()", String.class);
        } catch (Exception e) {
            postgisVersion = "No disponible";
        }

        return Map.of(
                "status", "OK",
                "database", dbStatus,
                "postgis", postgisVersion
        );
    }
}
