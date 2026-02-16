package com.app.demo.controller;

import com.app.demo.dto.ZoneCoverageRequest;
import com.app.demo.dto.ZoneCoverageResponse;
import com.app.demo.service.ZoneCoverageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zone-coverages")
public class ZoneCoverageController {

    private final ZoneCoverageService zoneCoverageService;

    public ZoneCoverageController(ZoneCoverageService zoneCoverageService) {
        this.zoneCoverageService = zoneCoverageService;
    }

    @GetMapping
    public List<ZoneCoverageResponse> getAll() {
        return zoneCoverageService.findAll()
                .stream()
                .map(ZoneCoverageResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    public ZoneCoverageResponse getById(@PathVariable Long id) {
        return ZoneCoverageResponse.fromEntity(zoneCoverageService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ZoneCoverageResponse> create(@Valid @RequestBody ZoneCoverageRequest request) {
        ZoneCoverageResponse response = ZoneCoverageResponse.fromEntity(zoneCoverageService.create(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ZoneCoverageResponse update(@PathVariable Long id, @Valid @RequestBody ZoneCoverageRequest request) {
        return ZoneCoverageResponse.fromEntity(zoneCoverageService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        zoneCoverageService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
