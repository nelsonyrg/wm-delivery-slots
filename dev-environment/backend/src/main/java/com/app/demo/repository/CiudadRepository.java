package com.app.demo.repository;

import com.app.demo.model.Ciudad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CiudadRepository extends JpaRepository<Ciudad, Long> {

    List<Ciudad> findByRegionIdOrderByNameAsc(Long regionId);
}
