package com.rentzy.backend.service;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@Slf4j
public class FcmService {

    @Value("${fcm.enabled:false}")
    private boolean fcmEnabled;

    @PostConstruct
    public void initialize() {
        if (!fcmEnabled) {
            log.info("FCM is disabled. Set fcm.enabled=true and add google-services.json to classpath to enable.");
            return;
        }
        try {
            ClassPathResource resource = new ClassPathResource("google-services-server.json");
            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(resource.getInputStream())
                    .createScoped("https://www.googleapis.com/auth/cloud-platform");

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(credentials)
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                log.info("Firebase FCM initialized successfully.");
            }
        } catch (IOException e) {
            log.warn("Could not initialize Firebase FCM: {}. Push notifications will be disabled.", e.getMessage());
        }
    }

    /**
     * Send a push notification to a specific device by its FCM token.
     *
     * @param fcmToken   The device FCM registration token (stored on User entity)
     * @param title      Notification title shown in device notification tray
     * @param body       Notification body text
     * @param dataPayload Optional extra key-value data (e.g. screen to navigate to)
     */
    public void sendNotification(String fcmToken, String title, String body, java.util.Map<String, String> dataPayload) {
        if (!fcmEnabled || fcmToken == null || fcmToken.isBlank()) {
            log.debug("FCM skipped: enabled={}, token present={}", fcmEnabled, fcmToken != null);
            return;
        }

        try {
            Message.Builder builder = Message.builder()
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .setToken(fcmToken);

            if (dataPayload != null && !dataPayload.isEmpty()) {
                builder.putAllData(dataPayload);
            }

            String response = FirebaseMessaging.getInstance().send(builder.build());
            log.info("FCM notification sent successfully. Response: {}", response);
        } catch (FirebaseMessagingException e) {
            log.error("Failed to send FCM notification to token {}: {}", fcmToken, e.getMessage());
        }
    }

    /**
     * Convenience overload for chat messages.
     */
    public void sendChatNotification(String fcmToken, String senderName, String messagePreview, Long senderId) {
        sendNotification(
                fcmToken,
                "Message from " + senderName,
                messagePreview.length() > 60 ? messagePreview.substring(0, 60) + "..." : messagePreview,
                java.util.Map.of("screen", "/chat/" + senderId, "type", "CHAT")
        );
    }
}
