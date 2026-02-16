package com.app.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class DeliveryAddressRequest {

    @NotNull(message = "El customer_id es obligatorio")
    private Long customerId;

    private Long comunaId;

    @NotBlank(message = "La calle es obligatoria")
    @Size(max = 200, message = "La calle no puede superar 200 caracteres")
    private String street;

    @NotBlank(message = "La localidad es obligatoria")
    @Size(max = 150, message = "La localidad no puede superar 150 caracteres")
    private String locality;

    @NotBlank(message = "La comuna es obligatoria")
    @Size(max = 100, message = "La comuna no puede superar 100 caracteres")
    private String commune;

    @NotBlank(message = "La region es obligatoria")
    @Size(max = 100, message = "La region no puede superar 100 caracteres")
    private String region;

    @Size(max = 20, message = "El codigo postal no puede superar 20 caracteres")
    private String postalCode;

    private Double latitude;

    private Double longitude;

    private Boolean isDefault;

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
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
}
