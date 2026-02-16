package com.app.demo.service;

import com.app.demo.dto.ActiveSessionLoginRequest;
import com.app.demo.exception.ConflictException;
import com.app.demo.exception.ResourceNotFoundException;
import com.app.demo.model.ActiveSession;
import com.app.demo.repository.ActiveSessionRepository;
import com.app.demo.repository.CustomerRepository;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class ActiveSessionService {

    private static final long SESSION_MINUTES = 5L;

    private final ActiveSessionRepository activeSessionRepository;
    private final CustomerRepository customerRepository;

    public ActiveSessionService(
            ActiveSessionRepository activeSessionRepository,
            CustomerRepository customerRepository
    ) {
        this.activeSessionRepository = activeSessionRepository;
        this.customerRepository = customerRepository;
    }

    public ActiveSession login(ActiveSessionLoginRequest request) {
        Long customerId = request.getCustomerId();
        if (!customerRepository.existsById(customerId)) {
            throw new ResourceNotFoundException("Customer no encontrado con id: " + customerId);
        }

        OffsetDateTime now = OffsetDateTime.now();
        closeExpiredSessions(customerId, now);

        if (activeSessionRepository
                .findFirstByCustomerIdAndEndedAtIsNullAndExpiresAtAfter(customerId, now)
                .isPresent()) {
            throw new ConflictException("Usuario ya tiene una sesión activa");
        }

        ActiveSession session = new ActiveSession();
        session.setCustomerId(customerId);
        session.setStartedAt(now);
        session.setExpiresAt(now.plusMinutes(SESSION_MINUTES));
        session.setEndedAt(null);
        return activeSessionRepository.save(session);
    }

    public ActiveSession validateSession(Long sessionId) {
        ActiveSession session = activeSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión no encontrada"));

        OffsetDateTime now = OffsetDateTime.now();
        if (session.getEndedAt() != null || !session.getExpiresAt().isAfter(now)) {
            if (session.getEndedAt() == null) {
                session.setEndedAt(session.getExpiresAt());
                activeSessionRepository.save(session);
            }
            throw new ResourceNotFoundException("Sesión activa no encontrada");
        }
        return session;
    }

    public void logout(Long sessionId) {
        ActiveSession session = activeSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión no encontrada"));

        if (session.getEndedAt() == null) {
            session.setEndedAt(OffsetDateTime.now());
            activeSessionRepository.save(session);
        }
    }

    private void closeExpiredSessions(Long customerId, OffsetDateTime now) {
        List<ActiveSession> expired = activeSessionRepository
                .findByCustomerIdAndEndedAtIsNullAndExpiresAtLessThanEqual(customerId, now);
        if (expired.isEmpty()) {
            return;
        }
        for (ActiveSession session : expired) {
            session.setEndedAt(session.getExpiresAt());
        }
        activeSessionRepository.saveAll(expired);
    }
}
