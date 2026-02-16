package com.app.demo.dto;

import com.app.demo.model.Region;

public class RegionResponse {

    private Long id;
    private String name;
    private Integer ordinal;
    private String abbreviation;

    public static RegionResponse fromEntity(Region entity) {
        RegionResponse response = new RegionResponse();
        response.id = entity.getId();
        response.name = entity.getName();
        response.ordinal = entity.getOrdinal();
        response.abbreviation = entity.getAbbreviation();
        return response;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Integer getOrdinal() {
        return ordinal;
    }

    public String getAbbreviation() {
        return abbreviation;
    }
}
