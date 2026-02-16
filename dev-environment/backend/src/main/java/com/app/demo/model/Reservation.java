package com.app.demo.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Entity
@Table(name = "reservation", schema = "app")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "delivery_address_id", nullable = false)
    private Long deliveryAddressId;

    @Column(name = "delivery_slot_id", nullable = false)
    private Long deliverySlotId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "app.reservation_status")
    private ReservationStatus status = ReservationStatus.CONFIRMED;

    @Column(name = "reserved_at", nullable = false)
    private OffsetDateTime reservedAt;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @Version
    @Column(nullable = false)
    private Integer version;

    @PrePersist
    protected void onCreate() {
        if (reservedAt == null) {
            reservedAt = OffsetDateTime.now();
        }
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
}
