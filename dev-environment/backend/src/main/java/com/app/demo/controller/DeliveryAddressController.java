package com.app.demo.controller;

import com.app.demo.dto.DeliveryAddressRequest;
import com.app.demo.dto.DeliveryAddressResponse;
import com.app.demo.service.DeliveryAddressService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-addresses")
public class DeliveryAddressController {

    private final DeliveryAddressService deliveryAddressService;

    public DeliveryAddressController(DeliveryAddressService deliveryAddressService) {
        this.deliveryAddressService = deliveryAddressService;
    }

    @GetMapping("/by-customer/{customerId}")
    public List<DeliveryAddressResponse> getByCustomer(@PathVariable Long customerId) {
        return deliveryAddressService.findByCustomerId(customerId);
    }

    @GetMapping("/{id}")
    public DeliveryAddressResponse getById(@PathVariable Long id) {
        return deliveryAddressService.findById(id);
    }

    @PostMapping
    public ResponseEntity<DeliveryAddressResponse> create(@Valid @RequestBody DeliveryAddressRequest request) {
        DeliveryAddressResponse response = deliveryAddressService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public DeliveryAddressResponse update(@PathVariable Long id, @Valid @RequestBody DeliveryAddressRequest request) {
        return deliveryAddressService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deliveryAddressService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
