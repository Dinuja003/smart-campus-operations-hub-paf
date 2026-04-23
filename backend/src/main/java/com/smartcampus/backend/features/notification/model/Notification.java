package com.smartcampus.backend.features.notification.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    private String userId;
    private NotificationType type;
    private String title;
    private String message;
    private String link;

    @Builder.Default
    private boolean isRead = false;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
