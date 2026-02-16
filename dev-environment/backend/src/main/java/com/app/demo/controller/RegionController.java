package com.app.demo.controller;

import com.app.demo.dto.RegionResponse;
import com.app.demo.service.RegionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/regiones")
public class RegionController {

    private final RegionService regionService;

    public RegionController(RegionService regionService) {
        this.regionService = regionService;
    }

    @GetMapping
    public List<RegionResponse> getAll() {
        return regionService.findAll()
                .stream()
                .map(RegionResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    public RegionResponse getById(@PathVariable Long id) {
        return RegionResponse.fromEntity(regionService.findById(id));
    }
}
