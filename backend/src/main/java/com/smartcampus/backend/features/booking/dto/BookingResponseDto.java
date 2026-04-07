package com.smartcampus.backend.features.booking.dto;

import com.smartcampus.backend.features.booking.model.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class BookingResponseDto {
    private String id;
    private String resourceId;
    private String resourceName;       // populated from resource lookup
    private String resourceType;
    private String requestedBy;
    private String requesterName;      // populated from user lookup
    private String bookingReason;
    private String date;
    private String startTime;
    private String endTime;
    private String purpose;
    private int expectedAttendees;
    private BookingStatus status;
    private String adminNote;
    private Instant createdAt;
    private Instant updatedAt;
}