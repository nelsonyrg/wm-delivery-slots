package com.app.demo.service;

import com.app.demo.exception.ResourceNotFoundException;
import com.app.demo.model.Region;
import com.app.demo.repository.RegionRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RegionService {

    private final RegionRepository regionRepository;

    public RegionService(RegionRepository regionRepository) {
        this.regionRepository = regionRepository;
    }

    public List<Region> findAll() {
        return regionRepository.findAll(Sort.by(Sort.Direction.ASC, "ordinal"));
    }

    public Region findById(Long id) {
        return regionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Region no encontrada con id: " + id));
    }
}
