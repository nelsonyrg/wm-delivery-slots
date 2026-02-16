package com.app.demo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.locationtech.jts.geom.Geometry;

public class ZoneCoverageRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
    private String name;

    private Long comunaId;

    @NotBlank(message = "La comuna es obligatoria")
    @Size(max = 100, message = "La comuna no puede superar 100 caracteres")
    private String commune;

    @NotBlank(message = "La region es obligatoria")
    @Size(max = 100, message = "La region no puede superar 100 caracteres")
    private String region;

    @Size(max = 150, message = "La localidad no puede superar 150 caracteres")
    private String locality;

    @Size(max = 20, message = "El codigo postal no puede superar 20 caracteres")
    private String postalCode;

    private Long deliverySlotId;

    @Min(value = 0, message = "La capacidad maxima no puede ser negativa")
    private Integer maxCapacity;

    @NotNull(message = "El boundary es obligatorio")
    private Geometry boundary;

    private Boolean isActive;

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

    public Geometry getBoundary() {
        return boundary;
    }

    public void setBoundary(Geometry boundary) {
        this.boundary = boundary;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
