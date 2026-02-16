package com.app.demo.service;

import com.app.demo.dto.DeliveryAddressRequest;
import com.app.demo.dto.DeliveryAddressResponse;
import com.app.demo.exception.ResourceNotFoundException;
import com.app.demo.model.DeliveryAddress;
import com.app.demo.model.ZoneCoverage;
import com.app.demo.repository.CustomerRepository;
import com.app.demo.repository.DeliveryAddressRepository;
import com.app.demo.repository.ZoneCoverageRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeliveryAddressService {

    private final DeliveryAddressRepository deliveryAddressRepository;
    private final CustomerRepository customerRepository;
    private final ZoneCoverageRepository zoneCoverageRepository;
    private final GeometryFactory geometryFactory;

    public DeliveryAddressService(
            DeliveryAddressRepository deliveryAddressRepository,
            CustomerRepository customerRepository,
            ZoneCoverageRepository zoneCoverageRepository
    ) {
        this.deliveryAddressRepository = deliveryAddressRepository;
        this.customerRepository = customerRepository;
        this.zoneCoverageRepository = zoneCoverageRepository;
        this.geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
    }

    public List<DeliveryAddressResponse> findByCustomerId(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer no encontrado con id: " + customerId);
        }
        List<DeliveryAddress> addresses = deliveryAddressRepository.findByCustomerIdOrderByIdAsc(customerId);
        return addresses.stream()
                .map(this::toResponseWithZoneName)
                .toList();
    }

    public DeliveryAddressResponse findById(Long id) {
        DeliveryAddress address = getOrThrow(id);
        return toResponseWithZoneName(address);
    }

    public DeliveryAddressResponse create(DeliveryAddressRequest request) {
        validateCustomer(request.getCustomerId());

        DeliveryAddress entity = new DeliveryAddress();
        applyChanges(entity, request);
        DeliveryAddress saved = deliveryAddressRepository.save(entity);
        return toResponseWithZoneName(saved);
    }

    public DeliveryAddressResponse update(Long id, DeliveryAddressRequest request) {
        DeliveryAddress entity = getOrThrow(id);
        applyChanges(entity, request);
        DeliveryAddress saved = deliveryAddressRepository.save(entity);
        return toResponseWithZoneName(saved);
    }

    public void delete(Long id) {
        if (!deliveryAddressRepository.existsById(id)) {
            throw new ResourceNotFoundException("Direccion de entrega no encontrada con id: " + id);
        }
        deliveryAddressRepository.deleteById(id);
    }

    private void applyChanges(DeliveryAddress entity, DeliveryAddressRequest request) {
        entity.setCustomerId(request.getCustomerId());
        entity.setComunaId(request.getComunaId());
        entity.setStreet(normalizeRequired(request.getStreet()));
        entity.setLocality(normalizeRequired(request.getLocality()));
        entity.setCommune(normalizeRequired(request.getCommune()));
        entity.setRegion(normalizeRequired(request.getRegion()));
        entity.setPostalCode(normalizeOptional(request.getPostalCode()));
        entity.setIsDefault(request.getIsDefault() != null ? request.getIsDefault() : false);

        if (request.getLatitude() != null && request.getLongitude() != null) {
            Point point = geometryFactory.createPoint(
                    new Coordinate(request.getLongitude(), request.getLatitude())
            );
            point.setSRID(4326);

            // Validate the point is inside at least one active zone_coverage boundary
            List<ZoneCoverage> matchingZones = zoneCoverageRepository.findByPointInsideBoundary(point);
            if (matchingZones.isEmpty()) {
                throw new IllegalArgumentException(
                        "La ubicacion seleccionada no se encuentra dentro de ninguna zona de cobertura activa"
                );
            }

            entity.setLocation(point);
            entity.setZoneCoverageId(matchingZones.getFirst().getId());
        } else {
            entity.setLocation(null);
            entity.setZoneCoverageId(null);
        }
    }

    private DeliveryAddressResponse toResponseWithZoneName(DeliveryAddress address) {
        String zoneName = null;
        if (address.getZoneCoverageId() != null) {
            zoneName = zoneCoverageRepository.findById(address.getZoneCoverageId())
                    .map(ZoneCoverage::getName)
                    .orElse(null);
        }
        return DeliveryAddressResponse.fromEntity(address, zoneName);
    }

    private void validateCustomer(Long customerId) {
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer no encontrado con id: " + customerId);
        }
    }

    private DeliveryAddress getOrThrow(Long id) {
        return deliveryAddressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Direccion de entrega no encontrada con id: " + id));
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
