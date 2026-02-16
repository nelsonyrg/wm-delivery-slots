package com.app.demo.service;

import com.app.demo.exception.ResourceNotFoundException;
import com.app.demo.model.Comuna;
import com.app.demo.repository.ComunaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ComunaService {

    private final ComunaRepository comunaRepository;

    public ComunaService(ComunaRepository comunaRepository) {
        this.comunaRepository = comunaRepository;
    }

    public List<Comuna> findByCiudadId(Long ciudadId) {
        return comunaRepository.findByCiudadIdOrderByNameAsc(ciudadId);
    }

    public Comuna findById(Long id) {
        return comunaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comuna no encontrada con id: " + id));
    }
}
