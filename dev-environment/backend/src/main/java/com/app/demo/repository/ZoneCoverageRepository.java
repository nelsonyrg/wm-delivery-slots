package com.app.demo.repository;

import com.app.demo.model.ZoneCoverage;
import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ZoneCoverageRepository extends JpaRepository<ZoneCoverage, Long> {

    @Query(value = """
            SELECT zc.* FROM app.zone_coverage zc
            WHERE zc.is_active = true
              AND zc.boundary IS NOT NULL
              AND ST_Contains(zc.boundary, :point)
            """, nativeQuery = true)
    List<ZoneCoverage> findByPointInsideBoundary(@Param("point") Point point);
}
