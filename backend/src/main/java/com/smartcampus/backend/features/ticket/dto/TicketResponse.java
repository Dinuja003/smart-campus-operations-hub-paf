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
    private LocalDateTime firstResponseAt;
    private LocalDateTime resolvedAt;
    private int healthScore;
    private String aiInsight;
    private int estimatedResolutionHours;
    private double successProbability;
    private int similarIncidents;
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
        response.firstResponseAt = ticket.getFirstResponseAt();
        response.resolvedAt = ticket.getResolvedAt();
        
        // Calculate basic health score & insight
        response.healthScore = calculateHealth(ticket);
        response.aiInsight = generateInsight(ticket);
        response.estimatedResolutionHours = calculateEstimatedHours(ticket);
        response.successProbability = 0.85 + (Math.random() * 0.1); // Simulated
        response.similarIncidents = (int) (Math.random() * 5) + 1; // Simulated

        response.editable = editable;
        response.deletable = deletable;
        return response;
    }

    private static int calculateHealth(Ticket ticket) {
        if (ticket.getStatus() == TicketStatus.RESOLVED || ticket.getStatus() == TicketStatus.CLOSED) return 100;
        
        int score = 85;
        if (ticket.getPriority() == TicketPriority.HIGH) score -= 15;
        
        long hoursOld = java.time.Duration.between(ticket.getCreatedAt(), LocalDateTime.now()).toHours();
        if (hoursOld > 24 && ticket.getFirstResponseAt() == null) score -= 30;
        else if (hoursOld > 2) score -= 10;
        
        return Math.max(0, score);
    }

    private static String generateInsight(Ticket ticket) {
        if (ticket.getStatus() == TicketStatus.RESOLVED) return "Resolution complete. Verify with user for final sign-off.";
        
        return switch (ticket.getCategory()) {
            case ELECTRICAL -> "High priority: Ensure floor power safety before inspection.";
            case SOFTWARE -> "Likely cache or credential issue. Check system logs first.";
            case HARDWARE -> "Check asset inventory for replacement parts in Building A.";
            case NETWORK -> "Possible congestion on Level 2. Verify signal strength.";
            default -> "Gather more context from the user to accelerate triage.";
        };
    }

    private static int calculateEstimatedHours(Ticket ticket) {
        int base = switch (ticket.getCategory()) {
            case ELECTRICAL -> 6;
            case SOFTWARE -> 4;
            case HARDWARE -> 8;
            case NETWORK -> 2;
            default -> 12;
        };
        if (ticket.getPriority() == TicketPriority.HIGH) base /= 2;
        return base;
    }

    public int getHealthScore() { return healthScore; }
    public String getAiInsight() { return aiInsight; }
    public int getEstimatedResolutionHours() { return estimatedResolutionHours; }
    public double getSuccessProbability() { return successProbability; }
    public int getSimilarIncidents() { return similarIncidents; }

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

    public LocalDateTime getFirstResponseAt() {
        return firstResponseAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public boolean isEditable() {
        return editable;
    }

    public boolean isDeletable() {
        return deletable;
    }
}