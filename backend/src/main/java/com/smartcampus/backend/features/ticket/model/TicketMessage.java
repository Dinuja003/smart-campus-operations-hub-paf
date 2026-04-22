package com.smartcampus.backend.features.ticket.model;

import java.time.LocalDateTime;

public class TicketMessage {
    private String senderId;
    private String senderName;
    private String senderRole;
    private String content;
    private LocalDateTime timestamp;

    public TicketMessage() {
        this.timestamp = LocalDateTime.now();
    }

    public TicketMessage(String senderId, String senderName, String senderRole, String content) {
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderRole = senderRole;
        this.content = content;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
