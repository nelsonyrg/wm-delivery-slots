package com.app.demo.service;

import com.app.demo.model.Location;
import com.app.demo.repository.LocationRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class LocationService {

    private final LocationRepository locationRepository;
    private final GeometryFactory geometryFactory;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
        this.geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    }

    public List<Location> findAll() {
        return locationRepository.findAll();
    }

    public Optional<Location> findById(UUID id) {
        return locationRepository.findById(id);
    }

    public Location create(String name, String description, double lat, double lng) {
        Location location = new Location();
        location.setName(name);
        location.setDescription(description);
        location.setCoordinates(geometryFactory.createPoint(new Coordinate(lng, lat)));
        return locationRepository.save(location);
    }

    public List<Location> findNearby(double lat, double lng, double distanceMeters) {
        return locationRepository.findNearby(lat, lng, distanceMeters);
    }

    public void delete(UUID id) {
        locationRepository.deleteById(id);
    }
}
