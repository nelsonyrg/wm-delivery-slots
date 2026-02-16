package com.app.demo.dto;

import jakarta.validation.constraints.NotNull;

public class ActiveSessionLoginRequest {

    @NotNull(message = "El customerId es obligatorio")
    private Long customerId;

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }
}
