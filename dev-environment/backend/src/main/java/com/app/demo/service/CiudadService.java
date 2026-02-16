package com.app.demo.service;

import com.app.demo.exception.ResourceNotFoundException;
import com.app.demo.model.Ciudad;
import com.app.demo.repository.CiudadRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CiudadService {

    private final CiudadRepository ciudadRepository;

    public CiudadService(CiudadRepository ciudadRepository) {
        this.ciudadRepository = ciudadRepository;
    }

    public List<Ciudad> findByRegionId(Long regionId) {
        return ciudadRepository.findByRegionIdOrderByNameAsc(regionId);
    }

    public Ciudad findById(Long id) {
        return ciudadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ciudad no encontrada con id: " + id));
    }
}
