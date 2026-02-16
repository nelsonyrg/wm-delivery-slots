package com.app.demo.controller;

import com.app.demo.dto.CiudadResponse;
import com.app.demo.service.CiudadService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ciudades")
public class CiudadController {

    private final CiudadService ciudadService;

    public CiudadController(CiudadService ciudadService) {
        this.ciudadService = ciudadService;
    }

    @GetMapping("/by-region/{regionId}")
    public List<CiudadResponse> getByRegion(@PathVariable Long regionId) {
        return ciudadService.findByRegionId(regionId)
                .stream()
                .map(CiudadResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    public CiudadResponse getById(@PathVariable Long id) {
        return CiudadResponse.fromEntity(ciudadService.findById(id));
    }
}
