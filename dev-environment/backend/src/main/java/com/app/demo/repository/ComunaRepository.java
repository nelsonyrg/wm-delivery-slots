package com.app.demo.repository;

import com.app.demo.model.Comuna;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComunaRepository extends JpaRepository<Comuna, Long> {

    List<Comuna> findByCiudadIdOrderByNameAsc(Long ciudadId);
}
