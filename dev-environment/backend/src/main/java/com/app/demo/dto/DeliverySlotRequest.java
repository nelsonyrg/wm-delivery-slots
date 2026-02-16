package com.app.demo.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DeliverySlotRequest {

    @NotNull(message = "El id de TimeSlotTemplate es obligatorio")
    private Long timeSlotTemplateId;

    @NotNull(message = "La fecha de entrega es obligatoria")
    private LocalDate deliveryDate;

    @NotNull(message = "El costo de entrega es obligatorio")
    @DecimalMin(value = "0.00", message = "El costo de entrega no puede ser negativo")
    private BigDecimal deliveryCost;

    @Min(value = 0, message = "La capacidad maxima no puede ser negativa")
    private Integer maxCapacity;

    @Min(value = 0, message = "La cantidad reservada no puede ser negativa")
    private Integer reservedCount;

    private Boolean isActive;

    @AssertTrue(message = "La cantidad reservada no puede ser mayor a la capacidad maxima")
    public boolean isReservedCountValid() {
        if (maxCapacity == null || reservedCount == null) {
            return true;
        }
        return reservedCount <= maxCapacity;
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
}
