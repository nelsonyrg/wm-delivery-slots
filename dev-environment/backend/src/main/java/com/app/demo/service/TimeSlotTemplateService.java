package com.app.demo.service;

import com.app.demo.dto.TimeSlotTemplateRequest;
import com.app.demo.exception.ConflictException;
import com.app.demo.exception.ResourceNotFoundException;
import com.app.demo.model.TimeSlotTemplate;
import com.app.demo.repository.TimeSlotTemplateRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TimeSlotTemplateService {

    private final TimeSlotTemplateRepository repository;

    public TimeSlotTemplateService(TimeSlotTemplateRepository repository) {
        this.repository = repository;
    }

    public List<TimeSlotTemplate> findAll() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "startTime"));
    }

    public TimeSlotTemplate findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TimeSlotTemplate no encontrado con id: " + id));
    }

    public TimeSlotTemplate create(TimeSlotTemplateRequest request) {
        if (repository.existsByStartTimeAndEndTime(request.getStartTime(), request.getEndTime())) {
            throw new ConflictException("Ya existe un TimeSlotTemplate con ese rango horario");
        }

        TimeSlotTemplate entity = new TimeSlotTemplate();
        applyChanges(entity, request);
        return repository.save(entity);
    }

    public TimeSlotTemplate update(Long id, TimeSlotTemplateRequest request) {
        TimeSlotTemplate entity = findById(id);
        if (repository.existsByStartTimeAndEndTimeAndIdNot(request.getStartTime(), request.getEndTime(), id)) {
            throw new ConflictException("Ya existe otro TimeSlotTemplate con ese rango horario");
        }

        applyChanges(entity, request);
        return repository.save(entity);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("TimeSlotTemplate no encontrado con id: " + id);
        }
        repository.deleteById(id);
    }

    private void applyChanges(TimeSlotTemplate entity, TimeSlotTemplateRequest request) {
        entity.setStartTime(request.getStartTime());
        entity.setEndTime(request.getEndTime());
        entity.setIsActive(request.getIsActive() == null ? Boolean.TRUE : request.getIsActive());
    }
}
