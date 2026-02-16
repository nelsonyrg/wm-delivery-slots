package com.app.demo.controller;

import com.app.demo.dto.TimeSlotTemplateRequest;
import com.app.demo.dto.TimeSlotTemplateResponse;
import com.app.demo.service.TimeSlotTemplateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/time-slot-templates")
public class TimeSlotTemplateController {

    private final TimeSlotTemplateService service;

    public TimeSlotTemplateController(TimeSlotTemplateService service) {
        this.service = service;
    }

    @GetMapping
    public List<TimeSlotTemplateResponse> getAll() {
        return service.findAll()
                .stream()
                .map(TimeSlotTemplateResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    public TimeSlotTemplateResponse getById(@PathVariable Long id) {
        return TimeSlotTemplateResponse.fromEntity(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<TimeSlotTemplateResponse> create(@Valid @RequestBody TimeSlotTemplateRequest request) {
        TimeSlotTemplateResponse response = TimeSlotTemplateResponse.fromEntity(service.create(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public TimeSlotTemplateResponse update(@PathVariable Long id, @Valid @RequestBody TimeSlotTemplateRequest request) {
        return TimeSlotTemplateResponse.fromEntity(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
