package com.app.demo.controller;

import com.app.demo.dto.ComunaResponse;
import com.app.demo.service.ComunaService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comunas")
public class ComunaController {

    private final ComunaService comunaService;

    public ComunaController(ComunaService comunaService) {
        this.comunaService = comunaService;
    }

    @GetMapping("/by-ciudad/{ciudadId}")
    public List<ComunaResponse> getByCiudad(@PathVariable Long ciudadId) {
        return comunaService.findByCiudadId(ciudadId)
                .stream()
                .map(ComunaResponse::fromEntity)
                .toList();
    }

    @GetMapping("/{id}")
    public ComunaResponse getById(@PathVariable Long id) {
        return ComunaResponse.fromEntity(comunaService.findById(id));
    }
}
