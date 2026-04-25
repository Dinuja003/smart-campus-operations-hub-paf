package com.smartcampus.backend.features.notification.repository;

import com.smartcampus.backend.features.notification.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

// Notification Flow: query helpers for per-user feed and unread badge aggregation.
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    long countByUserIdAndIsReadFalse(String userId);
}
