package com.app.demo.repository;

import com.app.demo.model.ActiveSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActiveSessionRepository extends JpaRepository<ActiveSession, Long> {

    Optional<ActiveSession> findFirstByCustomerIdAndEndedAtIsNullAndExpiresAtAfter(Long customerId, OffsetDateTime now);

    List<ActiveSession> findByCustomerIdAndEndedAtIsNullAndExpiresAtLessThanEqual(Long customerId, OffsetDateTime now);
}
