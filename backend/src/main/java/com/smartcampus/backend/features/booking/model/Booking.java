package com.smartcampus.backend.features.booking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    private String resourceId;         // Reference to Resource._id
    private String requestedBy;        // Reference to User._id
    private String bookingReason;      // Short reason/title
    private String resourceType;       

    private String date;               
    private String startTime;          
    private String endTime;            
    private int startTimeMinutes;      // 540  (for conflict checking)
    private int endTimeMinutes;        // 660

    private String purpose;            // Detailed purpose
    private int expectedAttendees;

    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    private String adminNote;          // Rejection/approval note from admin
    private String reviewedBy;         // Admin user id who reviewed

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}