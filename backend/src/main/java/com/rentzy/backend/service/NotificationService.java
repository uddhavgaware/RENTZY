package com.rentzy.backend.service;

import com.rentzy.backend.domain.Notification;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.NotificationRepository;
import com.rentzy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void createNotification(String userEmail, String message, String type) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return;

        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .type(type)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(String email) {
        return notificationRepository.findByUserEmailOrderByCreatedAtDesc(email);
    }

    public Long getUnreadCount(String email) {
        return notificationRepository.countByUserEmailAndIsReadFalse(email);
    }

    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(String email) {
        List<Notification> notifications = notificationRepository.findByUserEmailOrderByCreatedAtDesc(email);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }
}
