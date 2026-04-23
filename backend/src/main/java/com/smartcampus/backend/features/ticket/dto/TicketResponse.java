package com.smartcampus.backend.features.ticket.dto;

import com.smartcampus.backend.features.ticket.model.Attachment;
import com.smartcampus.backend.features.ticket.model.Ticket;
import com.smartcampus.backend.features.ticket.model.TicketCategory;
import com.smartcampus.backend.features.ticket.model.TicketPriority;
import com.smartcampus.backend.features.ticket.model.TicketStatus;

import java.time.LocalDateTime;
import java.util.List;

public class TicketResponse {

    private String id;
    private String userId;
    private String resourceId;
    private TicketCategory category;
    private String subject;
    private String description;
    private TicketPriority priority;
    private String location;
    private String preferredContact;
    private TicketStatus status;
    private String assignedTechnicianId;
    private String assignedTechnicianName;
    private String resolutionNotes;
    private List<Attachment> attachments;
    private List<com.smartcampus.backend.features.ticket.model.TicketMessage> messages;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean editable;
    private boolean deletable;

    public static TicketResponse from(Ticket ticket, boolean editable, boolean deletable, String technicianName) {
        TicketResponse response = new TicketResponse();
        response.id = ticket.getId();
        response.userId = ticket.getUserId();
        response.resourceId = ticket.getResourceId();
        response.category = ticket.getCategory();
        response.subject = ticket.getSubject();
        response.description = ticket.getDescription();
        response.priority = ticket.getPriority();
        response.location = ticket.getLocation();
        response.preferredContact = ticket.getPreferredContact();
        response.status = ticket.getStatus();
        response.assignedTechnicianId = ticket.getAssignedTechnicianId();
        response.assignedTechnicianName = technicianName;
        response.resolutionNotes = ticket.getResolutionNotes();
        response.attachments = ticket.getAttachments();
        response.messages = ticket.getMessages();
        response.createdAt = ticket.getCreatedAt();
        response.updatedAt = ticket.getUpdatedAt();
        response.editable = editable;
        response.deletable = deletable;
        return response;
    }

    public List<com.smartcampus.backend.features.ticket.model.TicketMessage> getMessages() {
        return messages;
    }

    public String getId() {
        return id;
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

    public TicketStatus getStatus() {
        return status;
    }

    public String getAssignedTechnicianId() {
        return assignedTechnicianId;
    }

    public String getAssignedTechnicianName() {
        return assignedTechnicianName;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public List<Attachment> getAttachments() {
        return attachments;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public boolean isEditable() {
        return editable;
    }

    public boolean isDeletable() {
        return deletable;
    }
}