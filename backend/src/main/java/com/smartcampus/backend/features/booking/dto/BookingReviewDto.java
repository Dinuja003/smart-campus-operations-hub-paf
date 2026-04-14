package com.smartcampus.backend.features.booking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingReviewDto {

    @NotNull(message = "Approved flag is required")
    private Boolean approved;   // true = APPROVED, false = REJECTED

    private String adminNote;   // required when rejecting (optional when approving)
}