package com.rentzy.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rentzy.backend.domain.PushSubscription;
import com.rentzy.backend.repository.PushSubscriptionRepository;
import com.rentzy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@RequiredArgsConstructor
public class WebPushService {

    private final PushSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final VapidService vapidService;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @Transactional
    public void saveSubscription(String email, Map<String, Object> subscriptionDto) {
        String endpoint = (String) subscriptionDto.get("endpoint");
        Map<String, String> keys = (Map<String, String>) subscriptionDto.get("keys");
        String p256dh = keys.get("p256dh");
        String auth = keys.get("auth");

        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        var existing = subscriptionRepository.findByEndpoint(endpoint);
        if (existing.isPresent()) {
            var sub = existing.get();
            sub.setP256dh(p256dh);
            sub.setAuth(auth);
            sub.setUser(user);
            subscriptionRepository.save(sub);
        } else {
            PushSubscription subscription = PushSubscription.builder()
                    .user(user)
                    .endpoint(endpoint)
                    .p256dh(p256dh)
                    .auth(auth)
                    .build();
            subscriptionRepository.save(subscription);
        }
    }

    public void sendPushNotification(String email, String title, String body, String link) {
        List<PushSubscription> subs = subscriptionRepository.findByUserEmail(email);
        if (subs.isEmpty()) return;

        executor.submit(() -> {
            try {
                PushService pushService = new PushService(
                        vapidService.getPublicKeyBase64(),
                        vapidService.getPrivateKeyBase64(),
                        "mailto:admin@rentxy.com"
                );

                ObjectMapper mapper = new ObjectMapper();
                String payload = mapper.writeValueAsString(Map.of(
                        "title", title,
                        "body", body,
                        "link", link != null ? link : "/"
                ));

                for (PushSubscription sub : subs) {
                    try {
                        Subscription clientSub = new Subscription(
                                sub.getEndpoint(),
                                new Subscription.Keys(sub.getP256dh(), sub.getAuth())
                        );

                        Notification notification = new Notification(clientSub, payload);
                        var response = pushService.send(notification);
                        int status = response.getStatusLine().getStatusCode();
                        
                        if (status == 201) {
                            System.out.println("Push notification sent successfully to endpoint: " + sub.getEndpoint());
                        } else if (status == 410 || status == 404) {
                            System.out.println("Subscription expired (Status " + status + "). Removing endpoint: " + sub.getEndpoint());
                            subscriptionRepository.deleteById(sub.getId());
                        } else {
                            System.err.println("Failed to send push notification. HTTP status: " + status);
                        }
                    } catch (Exception e) {
                        System.err.println("Error sending push notification to subscription " + sub.getId() + ": " + e.getMessage());
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to initialize push service: " + e.getMessage());
            }
        });
    }
}
