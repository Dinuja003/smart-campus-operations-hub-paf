package com.smartcampus.backend.features.ticket.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateTicketRequest {

    @NotBlank(message = "userId is required")
    private String userId;

    private String resourceId;

    @NotBlank(message = "category is required")
    private String category;

    @NotBlank(message = "subject is required")
    private String subject;

    @NotBlank(message = "description is required")
    private String description;

    @NotBlank(message = "priority is required")
    private String priority;

    @NotBlank(message = "location is required")
    private String location;

    private String preferredContact;

    public CreateTicketRequest() {
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getPreferredContact() {
        return preferredContact;
    }

    public void setPreferredContact(String preferredContact) {
        this.preferredContact = preferredContact;
    }
}