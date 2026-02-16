package com.app.demo.service;

import com.app.demo.dto.CustomerRequest;
import com.app.demo.exception.ConflictException;
import com.app.demo.exception.ResourceNotFoundException;
import com.app.demo.model.Customer;
import com.app.demo.repository.CustomerRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<Customer> findAll() {
        return customerRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
    }

    public Customer findById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer no encontrado con id: " + id));
    }

    public Customer findByEmail(String email) {
        String sanitized = sanitizeEmail(email);
        return customerRepository.findByEmailIgnoreCase(sanitized)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no registrado"));
    }

    public Customer create(CustomerRequest request) {
        String email = sanitizeEmail(request.getEmail());
        if (customerRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Ya existe un Customer con ese email");
        }

        Customer customer = new Customer();
        applyChanges(customer, request);
        return customerRepository.save(customer);
    }

    public Customer update(Long id, CustomerRequest request) {
        Customer customer = findById(id);
        String email = sanitizeEmail(request.getEmail());
        if (customerRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new ConflictException("Ya existe otro Customer con ese email");
        }

        applyChanges(customer, request);
        return customerRepository.save(customer);
    }

    public void delete(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Customer no encontrado con id: " + id);
        }
        customerRepository.deleteById(id);
    }

    private void applyChanges(Customer customer, CustomerRequest request) {
        customer.setFullName(normalizeRequired(request.getFullName()));
        customer.setEmail(sanitizeEmail(request.getEmail()));
        customer.setPhone(normalizeOptional(request.getPhone()));
        customer.setType(request.getType());
    }

    private String sanitizeEmail(String email) {
        return normalizeRequired(email).toLowerCase();
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
