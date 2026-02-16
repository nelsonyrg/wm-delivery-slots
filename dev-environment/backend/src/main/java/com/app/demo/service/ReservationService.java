package com.app.demo.service;

import com.app.demo.dto.ReservationRequest;
import com.app.demo.exception.ConflictException;
import com.app.demo.exception.ResourceNotFoundException;
import com.app.demo.model.*;
import com.app.demo.repository.*;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final CustomerRepository customerRepository;
    private final DeliveryAddressRepository deliveryAddressRepository;
    private final DeliverySlotRepository deliverySlotRepository;
    private final TimeSlotTemplateRepository timeSlotTemplateRepository;
    private final ZoneCoverageRepository zoneCoverageRepository;

    public ReservationService(
            ReservationRepository reservationRepository,
            CustomerRepository customerRepository,
            DeliveryAddressRepository deliveryAddressRepository,
            DeliverySlotRepository deliverySlotRepository,
            TimeSlotTemplateRepository timeSlotTemplateRepository,
            ZoneCoverageRepository zoneCoverageRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.customerRepository = customerRepository;
        this.deliveryAddressRepository = deliveryAddressRepository;
        this.deliverySlotRepository = deliverySlotRepository;
        this.timeSlotTemplateRepository = timeSlotTemplateRepository;
        this.zoneCoverageRepository = zoneCoverageRepository;
    }

    public List<Reservation> findAll() {
        return reservationRepository.findAll(
                Sort.by(Sort.Order.desc("reservedAt"), Sort.Order.desc("id"))
        );
    }

    public List<Reservation> findByCustomerId(Long customerId) {
        validateCustomerExists(customerId);
        return reservationRepository.findByCustomerIdOrderByReservedAtDescIdDesc(customerId);
    }

    public Reservation findById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation no encontrada con id: " + id));
    }

    @Transactional
    public Reservation create(ReservationRequest request) {
        validateCustomerExists(request.getCustomerId());

        DeliveryAddress deliveryAddress = getDeliveryAddressOrThrow(request.getDeliveryAddressId());
        validateAddressBelongsToCustomer(deliveryAddress, request.getCustomerId());

        DeliverySlot deliverySlot = lockDeliverySlotOrThrow(request.getDeliverySlotId());
        TimeSlotTemplate timeSlotTemplate = getTimeSlotTemplateOrThrow(deliverySlot.getTimeSlotTemplateId());

        validateAddressWithinDeliverySlot(deliveryAddress, deliverySlot.getId());

        OffsetDateTime reservedAt = buildReservedAt(request);
        validateReservationDateTime(reservedAt, deliverySlot, timeSlotTemplate);

        ReservationStatus status = request.getStatus() == null
                ? ReservationStatus.CONFIRMED
                : request.getStatus();
        validateCapacity(deliverySlot, status, null);

        Reservation entity = new Reservation();
        applyChanges(entity, request, reservedAt, status);
        Reservation saved = reservationRepository.save(entity);

        syncReservedCount(deliverySlot.getId());
        return saved;
    }

    @Transactional
    public Reservation update(Long id, ReservationRequest request) {
        Reservation entity = findById(id);
        Long previousSlotId = entity.getDeliverySlotId();

        validateCustomerExists(request.getCustomerId());

        DeliveryAddress deliveryAddress = getDeliveryAddressOrThrow(request.getDeliveryAddressId());
        validateAddressBelongsToCustomer(deliveryAddress, request.getCustomerId());

        DeliverySlot deliverySlot = lockDeliverySlotOrThrow(request.getDeliverySlotId());
        DeliverySlot previousDeliverySlot = null;
        if (!previousSlotId.equals(deliverySlot.getId())) {
            previousDeliverySlot = lockDeliverySlotOrThrow(previousSlotId);
        }

        TimeSlotTemplate timeSlotTemplate = getTimeSlotTemplateOrThrow(deliverySlot.getTimeSlotTemplateId());
        validateAddressWithinDeliverySlot(deliveryAddress, deliverySlot.getId());

        OffsetDateTime reservedAt = buildReservedAt(request);
        validateReservationDateTime(reservedAt, deliverySlot, timeSlotTemplate);

        ReservationStatus status = request.getStatus() == null
                ? ReservationStatus.CONFIRMED
                : request.getStatus();
        validateCapacity(deliverySlot, status, id);

        applyChanges(entity, request, reservedAt, status);
        Reservation saved = reservationRepository.save(entity);

        syncReservedCount(deliverySlot.getId());
        if (previousDeliverySlot != null) {
            syncReservedCount(previousDeliverySlot.getId());
        }

        return saved;
    }

    @Transactional
    public void delete(Long id) {
        Reservation entity = findById(id);
        DeliverySlot deliverySlot = lockDeliverySlotOrThrow(entity.getDeliverySlotId());
        reservationRepository.delete(entity);
        syncReservedCount(deliverySlot.getId());
    }

    private void applyChanges(
            Reservation entity,
            ReservationRequest request,
            OffsetDateTime reservedAt,
            ReservationStatus status
    ) {
        entity.setCustomerId(request.getCustomerId());
        entity.setDeliveryAddressId(request.getDeliveryAddressId());
        entity.setDeliverySlotId(request.getDeliverySlotId());
        entity.setReservedAt(reservedAt);
        entity.setStatus(status);

        if (status == ReservationStatus.CANCELLED) {
            if (entity.getCancelledAt() == null) {
                entity.setCancelledAt(OffsetDateTime.now());
            }
        } else {
            entity.setCancelledAt(null);
        }
    }

    private void validateCustomerExists(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer no encontrado con id: " + customerId);
        }
    }

    private DeliveryAddress getDeliveryAddressOrThrow(Long deliveryAddressId) {
        return deliveryAddressRepository.findById(deliveryAddressId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Direccion de entrega no encontrada con id: " + deliveryAddressId
                ));
    }

    private DeliverySlot lockDeliverySlotOrThrow(Long deliverySlotId) {
        return deliverySlotRepository.findByIdForUpdate(deliverySlotId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ventana de Entrega no encontrada con id: " + deliverySlotId
                ));
    }

    private TimeSlotTemplate getTimeSlotTemplateOrThrow(Long timeSlotTemplateId) {
        return timeSlotTemplateRepository.findById(timeSlotTemplateId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "TimeSlotTemplate no encontrado con id: " + timeSlotTemplateId
                ));
    }

    private void validateAddressBelongsToCustomer(DeliveryAddress address, Long customerId) {
        if (!customerId.equals(address.getCustomerId())) {
            throw new IllegalArgumentException(
                    "La direccion seleccionada no pertenece al cliente de la reserva"
            );
        }
    }

    private void validateAddressWithinDeliverySlot(DeliveryAddress address, Long deliverySlotId) {
        if (address.getZoneCoverageId() == null) {
            throw new IllegalArgumentException(
                    "La direccion seleccionada no tiene zona de cobertura asociada"
            );
        }

        ZoneCoverage zoneCoverage = zoneCoverageRepository.findById(address.getZoneCoverageId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Zona de cobertura no encontrada con id: " + address.getZoneCoverageId()
                ));

        if (zoneCoverage.getDeliverySlotId() == null || !zoneCoverage.getDeliverySlotId().equals(deliverySlotId)) {
            throw new IllegalArgumentException(
                    "La direccion seleccionada no pertenece a una zona del delivery_slot seleccionado"
            );
        }
    }

    private OffsetDateTime buildReservedAt(ReservationRequest request) {
        return OffsetDateTime.of(
                request.getReservationDate(),
                request.getReservationTime(),
                ZoneOffset.UTC
        );
    }

    private void validateReservationDateTime(
            OffsetDateTime reservedAt,
            DeliverySlot deliverySlot,
            TimeSlotTemplate timeSlotTemplate
    ) {
        if (!deliverySlot.getDeliveryDate().equals(reservedAt.toLocalDate())) {
            throw new IllegalArgumentException(
                    "La fecha de reserva debe coincidir con la fecha de la Ventana de Entrega seleccionada"
            );
        }

        LocalTime reservationTime = reservedAt.toLocalTime();
        LocalTime start = timeSlotTemplate.getStartTime();
        LocalTime end = timeSlotTemplate.getEndTime();
        boolean isWithinRange = !reservationTime.isBefore(start) && !reservationTime.isAfter(end);

        if (!isWithinRange) {
            throw new IllegalArgumentException(
                    "La hora de reserva debe estar dentro del rango horario del TimeSlotTemplate del delivery_slot"
            );
        }
    }

    private void validateCapacity(DeliverySlot deliverySlot, ReservationStatus status, Long excludeReservationId) {
        if (status != ReservationStatus.CONFIRMED) {
            return;
        }

        long confirmedReservations = excludeReservationId == null
                ? reservationRepository.countByDeliverySlotIdAndStatus(
                deliverySlot.getId(),
                ReservationStatus.CONFIRMED
        )
                : reservationRepository.countByDeliverySlotIdAndStatusAndIdNot(
                deliverySlot.getId(),
                ReservationStatus.CONFIRMED,
                excludeReservationId
        );

        if (confirmedReservations + 1 > deliverySlot.getMaxCapacity()) {
            throw new ConflictException(
                    "No hay capacidad disponible en la Ventana de Entrega seleccionada"
            );
        }
    }

    private void syncReservedCount(Long deliverySlotId) {
        DeliverySlot deliverySlot = lockDeliverySlotOrThrow(deliverySlotId);
        long confirmedReservations = reservationRepository.countByDeliverySlotIdAndStatus(
                deliverySlotId,
                ReservationStatus.CONFIRMED
        );
        deliverySlot.setReservedCount(Math.toIntExact(confirmedReservations));
        deliverySlotRepository.save(deliverySlot);
    }
}
