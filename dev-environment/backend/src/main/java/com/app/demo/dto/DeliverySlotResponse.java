package com.app.demo.dto;

import com.app.demo.model.DeliverySlot;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class DeliverySlotResponse {

    private Long id;
    private Long timeSlotTemplateId;
    private LocalDate deliveryDate;
    private BigDecimal deliveryCost;
    private Integer maxCapacity;
    private Integer reservedCount;
    private Boolean isActive;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static DeliverySlotResponse fromEntity(DeliverySlot entity) {
        DeliverySlotResponse response = new DeliverySlotResponse();
        response.setId(entity.getId());
        response.setTimeSlotTemplateId(entity.getTimeSlotTemplateId());
        response.setDeliveryDate(entity.getDeliveryDate());
        response.setDeliveryCost(entity.getDeliveryCost());
        response.setMaxCapacity(entity.getMaxCapacity());
        response.setReservedCount(entity.getReservedCount());
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

    public Long getTimeSlotTemplateId() {
        return timeSlotTemplateId;
    }

    public void setTimeSlotTemplateId(Long timeSlotTemplateId) {
        this.timeSlotTemplateId = timeSlotTemplateId;
    }

    public LocalDate getDeliveryDate() {
        return deliveryDate;
    }

    public void setDeliveryDate(LocalDate deliveryDate) {
        this.deliveryDate = deliveryDate;
    }

    public BigDecimal getDeliveryCost() {
        return deliveryCost;
    }

    public void setDeliveryCost(BigDecimal deliveryCost) {
        this.deliveryCost = deliveryCost;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public Integer getReservedCount() {
        return reservedCount;
    }

    public void setReservedCount(Integer reservedCount) {
        this.reservedCount = reservedCount;
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
