package com.app.demo.dto;

import com.app.demo.model.ZoneCoverage;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;

import java.time.OffsetDateTime;

public class ZoneCoverageResponse {

    private Long id;
    private String name;
    private Long comunaId;
    private String commune;
    private String region;
    private String locality;
    private String postalCode;
    private Long deliverySlotId;
    private Integer maxCapacity;
    private Polygon boundary;
    private Point location;
    private Boolean isActive;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static ZoneCoverageResponse fromEntity(ZoneCoverage entity) {
        ZoneCoverageResponse response = new ZoneCoverageResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setComunaId(entity.getComunaId());
        response.setCommune(entity.getCommune());
        response.setRegion(entity.getRegion());
        response.setLocality(entity.getLocality());
        response.setPostalCode(entity.getPostalCode());
        response.setDeliverySlotId(entity.getDeliverySlotId());
        response.setMaxCapacity(entity.getMaxCapacity());
        response.setBoundary(entity.getBoundary());
        response.setLocation(entity.getLocation());
        response.setIsActive(entity.getIsActive());
        response.setCreatedAt(entity.getCreatedAt());
        response.setUpdatedAt(entity.getUpdatedAt());
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getComunaId() {
        return comunaId;
    }

    public void setComunaId(Long comunaId) {
        this.comunaId = comunaId;
    }

    public String getCommune() {
        return commune;
    }

    public void setCommune(String commune) {
        this.commune = commune;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getLocality() {
        return locality;
    }

    public void setLocality(String locality) {
        this.locality = locality;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public Long getDeliverySlotId() {
        return deliverySlotId;
    }

    public void setDeliverySlotId(Long deliverySlotId) {
        this.deliverySlotId = deliverySlotId;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public Polygon getBoundary() {
        return boundary;
    }

    public void setBoundary(Polygon boundary) {
        this.boundary = boundary;
    }

    public Point getLocation() {
        return location;
    }

    public void setLocation(Point location) {
        this.location = location;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
