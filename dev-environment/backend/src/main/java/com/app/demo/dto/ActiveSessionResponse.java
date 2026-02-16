package com.app.demo.dto;

import com.app.demo.model.ActiveSession;

import java.time.OffsetDateTime;

public class ActiveSessionResponse {

    private Long id;
    private Long customerId;
    private OffsetDateTime startedAt;
    private OffsetDateTime expiresAt;
    private OffsetDateTime endedAt;
    private Boolean active;

    public static ActiveSessionResponse fromEntity(ActiveSession entity) {
        ActiveSessionResponse response = new ActiveSessionResponse();
        response.setId(entity.getId());
        response.setCustomerId(entity.getCustomerId());
        response.setStartedAt(entity.getStartedAt());
        response.setExpiresAt(entity.getExpiresAt());
        response.setEndedAt(entity.getEndedAt());
        response.setActive(entity.getEndedAt() == null && entity.getExpiresAt().isAfter(OffsetDateTime.now()));
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public OffsetDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(OffsetDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(OffsetDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public OffsetDateTime getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(OffsetDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
