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
    private final WebPushService webPushService;

    public void createNotification(String userEmail, String message, String type) {
        createNotification(userEmail, message, type, null);
    }

    public void createNotification(String userEmail, String message, String type, String link) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return;

        String title = getWittyTitle(type, message);
        String formattedMsg = formatWittyMessage(type, message);

        Notification notification = Notification.builder()
                .user(user)
                .message(formattedMsg)
                .type(type)
                .link(link)
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        try {
            webPushService.sendPushNotification(userEmail, title, formattedMsg, link);
        } catch (Exception e) {
            System.err.println("Failed to send Web Push notification: " + e.getMessage());
        }
    }

    private String getWittyTitle(String type, String originalMessage) {
        if (type == null) return "RentXY Alert 🔔";
        switch (type.toUpperCase()) {
            case "ROOMMATE":
            case "ROOMMATE_MATCH":
            case "ROOMMATE_REQUEST":
                return "🍕 Match made in pizza heaven!";
            case "BOOKING":
            case "VISIT":
                return "🔑 Landlord Approved!";
            case "PAYMENT":
            case "BILL":
                return "💸 No leaving group chat!";
            case "MOVER":
            case "MOVERS":
                return "📦 Zepto speed relocation!";
            case "LISTING":
                return "🚀 Boom! Property is LIVE!";
            default:
                return "RentXY Alert ⚡";
        }
    }

    private String formatWittyMessage(String type, String originalMessage) {
        if (originalMessage != null && (originalMessage.contains("🍕") || originalMessage.contains("🔑") || originalMessage.contains("📦"))) {
            return originalMessage; // Already formatted
        }

        if (type == null) return originalMessage;

        switch (type.toUpperCase()) {
            case "ROOMMATE":
            case "ROOMMATE_MATCH":
            case "ROOMMATE_REQUEST":
                return "Someone sent a roommate request! Time to split rent & garlic bread: " + originalMessage;
            case "BOOKING":
            case "VISIT":
                return "Visit request confirmed! Zero brokerage, zero drama — dream flat awaits! " + originalMessage;
            case "PAYMENT":
            case "BILL":
                return "Pay your bill split before your flatmate eats your secret ice cream stash 🍦! " + originalMessage;
            case "MOVER":
            case "MOVERS":
                return "Movers booked faster than 10-minute grocery delivery 📦! " + originalMessage;
            case "LISTING":
                return "100+ room seekers in Pune are checking out your listing right now! " + originalMessage;
            default:
                return originalMessage;
        }
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

    public void broadcastNotificationToAll(String title, String message, String type, String link) {
        List<User> allUsers = userRepository.findAll();
        for (User u : allUsers) {
            Notification notification = Notification.builder()
                    .user(u)
                    .message(message)
                    .type(type != null ? type : "SYSTEM")
                    .link(link != null ? link : "/dashboard")
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);

            try {
                webPushService.sendPushNotification(u.getEmail(), title != null ? title : "RentXY Alert ⚡", message, link);
            } catch (Exception e) {
                System.err.println("Failed to send push notification to " + u.getEmail() + ": " + e.getMessage());
            }
        }
    }
}
