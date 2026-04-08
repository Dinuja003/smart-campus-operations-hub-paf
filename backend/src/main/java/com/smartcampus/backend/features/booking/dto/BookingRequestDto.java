package com.smartcampus.backend.features.booking.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class BookingRequestDto {

    @NotBlank(message = "Resource ID is required")
    private String resourceId;

    @NotBlank(message = "Booking reason is required")
    private String bookingReason;

    @NotBlank(message = "Date is required")
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Date must be in format YYYY-MM-DD")
    private String date;

    @NotBlank(message = "Start time is required")
    @Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d", message = "Start time must be in HH:mm format")
    private String startTime;

    @NotBlank(message = "End time is required")
    @Pattern(regexp = "([01]\\d|2[0-3]):[0-5]\\d", message = "End time must be in HH:mm format")
    private String endTime;

    @NotBlank(message = "Purpose is required")
    @Size(min = 10, max = 500, message = "Purpose must be between 10 and 500 characters")
    private String purpose;

    @Min(value = 1, message = "Expected attendees must be at least 1")
    @Max(value = 1000, message = "Expected attendees cannot exceed 1000")
    private int expectedAttendees;
}