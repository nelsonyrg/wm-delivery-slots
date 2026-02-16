package com.app.demo.service;

import com.app.demo.dto.ZoneCoverageRequest;
import com.app.demo.exception.ResourceNotFoundException;
import com.app.demo.model.ZoneCoverage;
import com.app.demo.repository.DeliverySlotRepository;
import com.app.demo.repository.ZoneCoverageRepository;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ZoneCoverageService {

    private final ZoneCoverageRepository zoneCoverageRepository;
    private final DeliverySlotRepository deliverySlotRepository;

    public ZoneCoverageService(
            ZoneCoverageRepository zoneCoverageRepository,
            DeliverySlotRepository deliverySlotRepository
    ) {
        this.zoneCoverageRepository = zoneCoverageRepository;
        this.deliverySlotRepository = deliverySlotRepository;
    }

    public List<ZoneCoverage> findAll() {
        return zoneCoverageRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
    }

    public ZoneCoverage findById(Long id) {
        return zoneCoverageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ZoneCoverage no encontrado con id: " + id));
    }

    public ZoneCoverage create(ZoneCoverageRequest request) {
        validateDeliverySlot(request.getDeliverySlotId());
        ZoneCoverage entity = new ZoneCoverage();
        applyChanges(entity, request);
        return zoneCoverageRepository.save(entity);
    }

    public ZoneCoverage update(Long id, ZoneCoverageRequest request) {
        ZoneCoverage entity = findById(id);
        validateDeliverySlot(request.getDeliverySlotId());
        applyChanges(entity, request);
        return zoneCoverageRepository.save(entity);
    }

    public void delete(Long id) {
        if (!zoneCoverageRepository.existsById(id)) {
            throw new ResourceNotFoundException("ZoneCoverage no encontrado con id: " + id);
        }
        zoneCoverageRepository.deleteById(id);
    }

    private void validateDeliverySlot(Long deliverySlotId) {
        if (deliverySlotId != null && !deliverySlotRepository.existsById(deliverySlotId)) {
            throw new ResourceNotFoundException("DeliverySlot no encontrado con id: " + deliverySlotId);
        }
    }

    private void applyChanges(ZoneCoverage entity, ZoneCoverageRequest request) {
        Polygon polygon = toPolygon(request.getBoundary());
        Point centroid = polygon.getCentroid();
        centroid.setSRID(4326);

        entity.setName(normalizeRequired(request.getName()));
        entity.setComunaId(request.getComunaId());
        entity.setCommune(normalizeRequired(request.getCommune()));
        entity.setRegion(normalizeRequired(request.getRegion()));
        entity.setLocality(normalizeOptional(request.getLocality()));
        entity.setPostalCode(normalizeOptional(request.getPostalCode()));
        entity.setDeliverySlotId(request.getDeliverySlotId());
        entity.setMaxCapacity(request.getMaxCapacity() == null ? 0 : request.getMaxCapacity());
        entity.setBoundary(polygon);
        entity.setLocation(centroid);
        entity.setIsActive(request.getIsActive() == null ? Boolean.TRUE : request.getIsActive());
    }

    private Polygon toPolygon(Geometry boundary) {
        if (!(boundary instanceof Polygon polygon)) {
            throw new IllegalArgumentException("El boundary debe ser un poligono GeoJSON valido");
        }
        polygon.setSRID(4326);
        if (polygon.isEmpty() || !polygon.isValid()) {
            throw new IllegalArgumentException("El boundary debe ser un poligono valido");
        }
        return polygon;
    }

    private String normalizeRequired(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
