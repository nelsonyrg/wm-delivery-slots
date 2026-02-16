package com.app.demo.service;

import com.app.demo.dto.DeliverySlotRequest;
import com.app.demo.exception.ConflictException;
import com.app.demo.exception.ResourceNotFoundException;
import com.app.demo.model.DeliverySlot;
import com.app.demo.repository.DeliverySlotRepository;
import com.app.demo.repository.TimeSlotTemplateRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliverySlotService {

    private final DeliverySlotRepository deliverySlotRepository;
    private final TimeSlotTemplateRepository timeSlotTemplateRepository;

    public DeliverySlotService(
            DeliverySlotRepository deliverySlotRepository,
            TimeSlotTemplateRepository timeSlotTemplateRepository
    ) {
        this.deliverySlotRepository = deliverySlotRepository;
        this.timeSlotTemplateRepository = timeSlotTemplateRepository;
    }

    public List<DeliverySlot> findAll() {
        Sort sort = Sort.by(
                Sort.Order.asc("deliveryDate"),
                Sort.Order.asc("timeSlotTemplateId")
        );
        return deliverySlotRepository.findAll(sort);
    }

    public DeliverySlot findById(Long id) {
        return deliverySlotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DeliverySlot no encontrado con id: " + id));
    }

    public DeliverySlot create(DeliverySlotRequest request) {
        validateTimeSlotTemplateExists(request.getTimeSlotTemplateId());
        validateUniqueDeliverySlot(request.getDeliveryDate(), request.getTimeSlotTemplateId(), null);

        DeliverySlot entity = new DeliverySlot();
        applyChanges(entity, request);
        return deliverySlotRepository.save(entity);
    }

    public DeliverySlot update(Long id, DeliverySlotRequest request) {
        DeliverySlot entity = findById(id);
        validateTimeSlotTemplateExists(request.getTimeSlotTemplateId());
        validateUniqueDeliverySlot(request.getDeliveryDate(), request.getTimeSlotTemplateId(), id);

        applyChanges(entity, request);
        return deliverySlotRepository.save(entity);
    }

    public void delete(Long id) {
        if (!deliverySlotRepository.existsById(id)) {
            throw new ResourceNotFoundException("DeliverySlot no encontrado con id: " + id);
        }
        deliverySlotRepository.deleteById(id);
    }

    private void validateTimeSlotTemplateExists(Long timeSlotTemplateId) {
        if (!timeSlotTemplateRepository.existsById(timeSlotTemplateId)) {
            throw new ResourceNotFoundException(
                    "TimeSlotTemplate no encontrado con id: " + timeSlotTemplateId
            );
        }
    }

    private void validateUniqueDeliverySlot(
            java.time.LocalDate deliveryDate,
            Long timeSlotTemplateId,
            Long excludeId
    ) {
        boolean exists = excludeId == null
                ? deliverySlotRepository.existsByDeliveryDateAndTimeSlotTemplateId(deliveryDate, timeSlotTemplateId)
                : deliverySlotRepository.existsByDeliveryDateAndTimeSlotTemplateIdAndIdNot(
                deliveryDate,
                timeSlotTemplateId,
                excludeId
        );

        if (exists) {
            throw new ConflictException("Ya existe una Ventana de Entrega para esa fecha y TimeSlotTemplate");
        }
    }

    private void applyChanges(DeliverySlot entity, DeliverySlotRequest request) {
        int maxCapacity = request.getMaxCapacity() == null ? 0 : request.getMaxCapacity();
        int reservedCount = request.getReservedCount() == null ? 0 : request.getReservedCount();
        if (reservedCount > maxCapacity) {
            throw new ConflictException("La cantidad reservada no puede ser mayor a la capacidad maxima");
        }

        entity.setTimeSlotTemplateId(request.getTimeSlotTemplateId());
        entity.setDeliveryDate(request.getDeliveryDate());
        entity.setDeliveryCost(request.getDeliveryCost());
        entity.setMaxCapacity(maxCapacity);
        entity.setReservedCount(reservedCount);
        entity.setIsActive(request.getIsActive() == null ? Boolean.TRUE : request.getIsActive());
    }
}
