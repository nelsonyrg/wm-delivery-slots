package com.app.demo.repository;

import com.app.demo.model.DeliverySlot;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DeliverySlotRepository extends JpaRepository<DeliverySlot, Long> {

    boolean existsByDeliveryDateAndTimeSlotTemplateId(LocalDate deliveryDate, Long timeSlotTemplateId);

    boolean existsByDeliveryDateAndTimeSlotTemplateIdAndIdNot(LocalDate deliveryDate, Long timeSlotTemplateId, Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ds FROM DeliverySlot ds WHERE ds.id = :id")
    Optional<DeliverySlot> findByIdForUpdate(@Param("id") Long id);
}
