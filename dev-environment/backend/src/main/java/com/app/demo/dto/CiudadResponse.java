package com.app.demo.dto;

import com.app.demo.model.Ciudad;

public class CiudadResponse {

    private Long id;
    private String name;
    private Long regionId;

    public static CiudadResponse fromEntity(Ciudad entity) {
        CiudadResponse response = new CiudadResponse();
        response.id = entity.getId();
        response.name = entity.getName();
        response.regionId = entity.getRegionId();
        return response;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Long getRegionId() {
        return regionId;
    }
}
