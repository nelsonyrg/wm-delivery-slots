package com.app.demo.repository;

import com.app.demo.model.Reservation;
import com.app.demo.model.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByCustomerIdOrderByReservedAtDescIdDesc(Long customerId);

    long countByDeliverySlotIdAndStatus(Long deliverySlotId, ReservationStatus status);

    long countByDeliverySlotIdAndStatusAndIdNot(Long deliverySlotId, ReservationStatus status, Long id);
}
