package com.app.demo.dto;

import com.app.demo.model.Comuna;

public class ComunaResponse {

    private Long id;
    private String name;
    private Long ciudadId;

    public static ComunaResponse fromEntity(Comuna entity) {
        ComunaResponse response = new ComunaResponse();
        response.id = entity.getId();
        response.name = entity.getName();
        response.ciudadId = entity.getCiudadId();
        return response;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Long getCiudadId() {
        return ciudadId;
    }
}
