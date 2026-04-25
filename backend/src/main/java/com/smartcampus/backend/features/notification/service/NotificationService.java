package com.smartcampus.backend.features.notification.service;

import com.smartcampus.backend.features.notification.dto.NotificationResponse;
import com.smartcampus.backend.features.notification.model.Notification;
import com.smartcampus.backend.features.notification.model.NotificationType;
import com.smartcampus.backend.features.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // Notification Flow: persist first for durability, then push realtime via WebSocket.
    public void send(String userId, NotificationType type, String title, String message, String link) {
        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = NotificationResponse.from(saved);

        try {
            // Notification Flow: /user destination targets only the intended recipient.
            messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", response);
        } catch (Exception e) {
            log.warn("WebSocket push failed for user {}: {}", userId, e.getMessage());
        }
    }

    // Notification Flow: feed API read model used by list page and dropdown.
    public List<NotificationResponse> getForUser(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .collect(Collectors.toList());
    }

    // Notification Flow: count drives unread badge in navbar bell.
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    // Security: update is allowed only when notification belongs to authenticated user.
    public void markAsRead(String notificationId, String userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    // Notification Flow: idempotent bulk read transition for current user's feed.
    public void markAllRead(String userId) {
        List<Notification> unread = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(n -> !n.isRead())
                .collect(Collectors.toList());
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}
