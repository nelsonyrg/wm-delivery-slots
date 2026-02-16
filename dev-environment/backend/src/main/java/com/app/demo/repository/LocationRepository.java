package com.app.demo.repository;

import com.app.demo.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {

    List<Location> findByNameContainingIgnoreCase(String name);

    @Query(value = """
            SELECT * FROM app.locations
            WHERE ST_DWithin(
                coordinates::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :distanceMeters
            )
            """, nativeQuery = true)
    List<Location> findNearby(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("distanceMeters") double distanceMeters
    );
}
