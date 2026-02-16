package com.app.demo.repository;

import com.app.demo.model.TimeSlotTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;

@Repository
public interface TimeSlotTemplateRepository extends JpaRepository<TimeSlotTemplate, Long> {

    boolean existsByStartTimeAndEndTime(LocalTime startTime, LocalTime endTime);

    boolean existsByStartTimeAndEndTimeAndIdNot(LocalTime startTime, LocalTime endTime, Long id);
}
