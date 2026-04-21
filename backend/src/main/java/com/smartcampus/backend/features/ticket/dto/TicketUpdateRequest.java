package com.smartcampus.backend.features.ticket.dto;

import com.smartcampus.backend.features.ticket.model.TicketCategory;
import com.smartcampus.backend.features.ticket.model.TicketPriority;

public class TicketUpdateRequest {

    private String resourceId;
    private TicketCategory category;
    private String subject;
    private String description;
    private TicketPriority priority;
    private String location;
    private String preferredContact;

    public TicketUpdateRequest() {
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