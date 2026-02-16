package com.app.demo.dto;

import com.app.demo.model.DeliveryAddress;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;

public class DeliveryAddressResponse {

    private Long id;
    private Long customerId;
    private Long zoneCoverageId;
    private String zoneCoverageName;
    private Long comunaId;
    private String street;
    private String locality;
    private String commune;
    private String region;
    private String postalCode;
    private Double latitude;
    private Double longitude;
    private Boolean isDefault;
    private OffsetDateTime createdAt;

    public static DeliveryAddressResponse fromEntity(DeliveryAddress entity) {
        return fromEntity(entity, null);
    }

    public static DeliveryAddressResponse fromEntity(DeliveryAddress entity, String zoneName) {
        DeliveryAddressResponse response = new DeliveryAddressResponse();
        response.setId(entity.getId());
        response.setCustomerId(entity.getCustomerId());
        response.setZoneCoverageId(entity.getZoneCoverageId());
        response.setZoneCoverageName(zoneName);
        response.setComunaId(entity.getComunaId());
        response.setStreet(entity.getStreet());
        response.setLocality(entity.getLocality());
        response.setCommune(entity.getCommune());
        response.setRegion(entity.getRegion());
        response.setPostalCode(entity.getPostalCode());
        response.setIsDefault(entity.getIsDefault());
        response.setCreatedAt(entity.getCreatedAt());

        Point location = entity.getLocation();
        if (location != null) {
            response.setLatitude(location.getY());
            response.setLongitude(location.getX());
        }

        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getZoneCoverageId() {
        return zoneCoverageId;
    }

    public void setZoneCoverageId(Long zoneCoverageId) {
        this.zoneCoverageId = zoneCoverageId;
    }

    public String getZoneCoverageName() {
        return zoneCoverageName;
    }

    public void setZoneCoverageName(String zoneCoverageName) {
        this.zoneCoverageName = zoneCoverageName;
    }

    public Long getComunaId() {
        return comunaId;
    }

    public void setComunaId(Long comunaId) {
        this.comunaId = comunaId;
    }

    public String getStreet() {
        return street;
    }

    public void setStreet(String street) {
        this.street = street;
    }

    public String getLocality() {
        return locality;
    }

    public void setLocality(String locality) {
        this.locality = locality;
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

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
