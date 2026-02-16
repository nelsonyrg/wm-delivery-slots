package com.app.demo.controller;

import com.app.demo.dto.DeliverySlotRequest;
import com.app.demo.dto.DeliverySlotResponse;
import com.app.demo.service.DeliverySlotService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-slots")
public class DeliverySlotController {

    private final DeliverySlotService deliverySlotService;

    public DeliverySlotController(DeliverySlotService deliverySlotService) {
        this.deliverySlotService = deliverySlotService;
    }

    @GetMapping
    public List<DeliverySlotResponse> getAll() {
        return deliverySlotService.findAll()
                .stream()
                .map(DeliverySlotResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    public DeliverySlotResponse getById(@PathVariable Long id) {
        return DeliverySlotResponse.fromEntity(deliverySlotService.findById(id));
    }

    @PostMapping
    public ResponseEntity<DeliverySlotResponse> create(@Valid @RequestBody DeliverySlotRequest request) {
        DeliverySlotResponse response = DeliverySlotResponse.fromEntity(deliverySlotService.create(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public DeliverySlotResponse update(@PathVariable Long id, @Valid @RequestBody DeliverySlotRequest request) {
        return DeliverySlotResponse.fromEntity(deliverySlotService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deliverySlotService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
