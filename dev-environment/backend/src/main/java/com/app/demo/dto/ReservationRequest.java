package com.app.demo.dto;

import com.app.demo.model.ReservationStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public class ReservationRequest {

    @NotNull(message = "El customer_id es obligatorio")
    private Long customerId;

    @NotNull(message = "El delivery_address_id es obligatorio")
    private Long deliveryAddressId;

    @NotNull(message = "El delivery_slot_id es obligatorio")
    private Long deliverySlotId;

    @NotNull(message = "La fecha de reserva es obligatoria")
    private LocalDate reservationDate;

    @NotNull(message = "La hora de reserva es obligatoria")
    private LocalTime reservationTime;

    private ReservationStatus status;

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

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }
}
