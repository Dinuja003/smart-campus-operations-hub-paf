package com.smartcampus.backend.features.ticket.dto;

import com.smartcampus.backend.features.ticket.model.TicketCategory;
import com.smartcampus.backend.features.ticket.model.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateTicketRequest {

    @NotBlank(message = "User ID is required")
    private String userId;

    private String resourceId;

    @NotNull(message = "Category is required")
    private TicketCategory category;

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    @NotBlank(message = "Location is required")
    private String location;

    @NotBlank(message = "Preferred contact is required")
    private String preferredContact;

    private String bookingId;

    public CreateTicketRequest() {
    }

    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    public String getUserId() {
        return userId;
    }

    public String getResourceId() {
        return resourceId;
    }

    public TicketCategory getCategory() {
        return category;
    }

    public String getSubject() {
        return subject;
    }

    public String getDescription() {
        return description;
    }

    public TicketPriority getPriority() {
        return priority;
    }

    public String getLocation() {
        return location;
    }

    public String getPreferredContact() {
        return preferredContact;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public void setCategory(TicketCategory category) {
        this.category = category;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setPriority(TicketPriority priority) {
        this.priority = priority;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public void setPreferredContact(String preferredContact) {
        this.preferredContact = preferredContact;
    }
}