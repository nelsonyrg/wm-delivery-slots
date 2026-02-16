package com.app.demo.dto;

import com.app.demo.model.TimeSlotTemplate;

import java.time.LocalTime;

public class TimeSlotTemplateResponse {

    private Long id;
    private LocalTime startTime;
    private LocalTime endTime;
    private Boolean isActive;

    public static TimeSlotTemplateResponse fromEntity(TimeSlotTemplate entity) {
        TimeSlotTemplateResponse response = new TimeSlotTemplateResponse();
        response.setId(entity.getId());
        response.setStartTime(entity.getStartTime());
        response.setEndTime(entity.getEndTime());
        response.setIsActive(entity.getIsActive());
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
