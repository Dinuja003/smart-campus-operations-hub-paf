package com.smartcampus.backend.features.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.smartcampus.backend.features.notification.model.Notification;
import com.smartcampus.backend.features.notification.model.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
// Notification Flow: serialized payload used by REST APIs and WebSocket pushes.
public class NotificationResponse {
    private String id;
    private NotificationType type;
    private String title;
    private String message;
    private String link;
    @JsonProperty("isRead")
    private boolean isRead;
    private Instant createdAt;

    // Notification Flow: mapper keeps REST and WebSocket payloads identical.
    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .link(n.getLink())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
