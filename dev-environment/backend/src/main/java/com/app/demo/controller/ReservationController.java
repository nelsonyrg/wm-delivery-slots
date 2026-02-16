package com.app.demo.controller;

import com.app.demo.dto.ReservationRequest;
import com.app.demo.dto.ReservationResponse;
import com.app.demo.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    public List<ReservationResponse> getAll() {
        return reservationService.findAll()
                .stream()
                .map(ReservationResponse::fromEntity)
                .toList();
    }

    @GetMapping("/by-customer/{customerId}")
    public List<ReservationResponse> getByCustomer(@PathVariable Long customerId) {
        return reservationService.findByCustomerId(customerId)
                .stream()
                .map(ReservationResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    public ReservationResponse getById(@PathVariable Long id) {
        return ReservationResponse.fromEntity(reservationService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> create(@Valid @RequestBody ReservationRequest request) {
        ReservationResponse response = ReservationResponse.fromEntity(reservationService.create(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ReservationResponse update(@PathVariable Long id, @Valid @RequestBody ReservationRequest request) {
        return ReservationResponse.fromEntity(reservationService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reservationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
