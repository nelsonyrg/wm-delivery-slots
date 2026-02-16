package com.app.demo.dto;

import com.app.demo.model.Reservation;
import com.app.demo.model.ReservationStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

public class ReservationResponse {

    private Long id;
    private Long customerId;
    private Long deliveryAddressId;
    private Long deliverySlotId;
    private ReservationStatus status;
    private LocalDate reservationDate;
    private LocalTime reservationTime;
    private OffsetDateTime reservedAt;
    private OffsetDateTime cancelledAt;
    private Integer version;

    public static ReservationResponse fromEntity(Reservation entity) {
        ReservationResponse response = new ReservationResponse();
        response.setId(entity.getId());
        response.setCustomerId(entity.getCustomerId());
        response.setDeliveryAddressId(entity.getDeliveryAddressId());
        response.setDeliverySlotId(entity.getDeliverySlotId());
        response.setStatus(entity.getStatus());
        response.setReservedAt(entity.getReservedAt());
        response.setCancelledAt(entity.getCancelledAt());
        response.setVersion(entity.getVersion());
        if (entity.getReservedAt() != null) {
            response.setReservationDate(entity.getReservedAt().toLocalDate());
            response.setReservationTime(entity.getReservedAt().toLocalTime());
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

    public Long getDeliveryAddressId() {
        return deliveryAddressId;
    }

    public void setDeliveryAddressId(Long deliveryAddressId) {
        this.deliveryAddressId = deliveryAddressId;
    }

    public Long getDeliverySlotId() {
        return deliverySlotId;
    }

    public void setDeliverySlotId(Long deliverySlotId) {
        this.deliverySlotId = deliverySlotId;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public LocalDate getReservationDate() {
        return reservationDate;
    }

    public void setReservationDate(LocalDate reservationDate) {
        this.reservationDate = reservationDate;
    }

    public LocalTime getReservationTime() {
        return reservationTime;
    }

    public void setReservationTime(LocalTime reservationTime) {
        this.reservationTime = reservationTime;
    }

    public OffsetDateTime getReservedAt() {
        return reservedAt;
    }

    public void setReservedAt(OffsetDateTime reservedAt) {
        this.reservedAt = reservedAt;
    }

    public OffsetDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(OffsetDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }
}
