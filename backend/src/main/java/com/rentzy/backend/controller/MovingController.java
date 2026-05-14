package com.rentzy.backend.controller;

import com.rentzy.backend.domain.MovingRequest;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.MovingRequestRepository;
import com.rentzy.backend.repository.UserRepository;
import com.rentzy.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/moving")
@RequiredArgsConstructor
public class MovingController {

    private final MovingRequestRepository movingRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // User submits a moving request
    @PostMapping("/request")
    public ResponseEntity<?> createRequest(@RequestBody Map<String, String> body, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        MovingRequest request = new MovingRequest();
        request.setUser(user);
        request.setFromLocation(body.get("fromLocation"));
        request.setToLocation(body.get("toLocation"));
        request.setMovingDate(body.get("movingDate"));
        request.setMovingTime(body.get("movingTime"));
        request.setPropertySize(body.get("propertySize"));
        request.setAdditionalNotes(body.get("additionalNotes"));
        request.setStatus("PENDING");
        
        // MVP: Simple mock estimation
        double estimatedPrice = 5000.0;
        if (request.getPropertySize() != null && request.getPropertySize().contains("2BHK")) estimatedPrice = 8000.0;
        if (request.getPropertySize() != null && request.getPropertySize().contains("3BHK")) estimatedPrice = 12000.0;
        request.setEstimatedPrice(estimatedPrice);

        MovingRequest saved = movingRequestRepository.save(request);

        // Notify user that request was received
        notificationService.createNotification(
                user.getEmail(),
                "🚚 Your moving request from " + request.getFromLocation() + " to " + request.getToLocation() + " has been submitted! We'll assign a verified mover shortly.",
                "SYSTEM"
        );

        return ResponseEntity.ok(saved);
    }

    // User gets their own moving requests
    @GetMapping("/my")
    public ResponseEntity<List<MovingRequest>> getMyRequests(Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(movingRequestRepository.findByUserOrderByCreatedAtDesc(user));
    }

    @PostMapping("/request/{id}/cancel")
    public ResponseEntity<MovingRequest> cancelRequest(@PathVariable Long id, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        MovingRequest request = movingRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (!request.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only cancel your own requests");
        }
        if (!request.getStatus().equals("PENDING")) {
            throw new RuntimeException("Only pending requests can be cancelled");
        }
        
        request.setStatus("CANCELLED");
        return ResponseEntity.ok(movingRequestRepository.save(request));
    }

    // Admin gets all requests
    @GetMapping("/admin/all")
    public ResponseEntity<List<MovingRequest>> getAllRequests() {
        return ResponseEntity.ok(movingRequestRepository.findAllByOrderByCreatedAtDesc());
    }

    // Admin updates status
    @PutMapping("/admin/{id}/status")
    public ResponseEntity<MovingRequest> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        MovingRequest request = movingRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        request.setStatus(body.get("status"));
        if (body.containsKey("estimatedPrice")) {
            request.setEstimatedPrice(Double.parseDouble(body.get("estimatedPrice")));
        }
        return ResponseEntity.ok(movingRequestRepository.save(request));
    }

    // ==========================================
    // VENDOR (MOVER) ENDPOINTS
    // ==========================================

    @GetMapping("/vendor/available")
    public ResponseEntity<List<MovingRequest>> getAvailableRequests(Authentication auth) {
        User mover = userRepository.findByEmail(auth.getName()).orElse(null);
        List<MovingRequest> requests = movingRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING");
        
        if (mover != null && mover.getServiceCity() != null && !mover.getServiceCity().trim().isEmpty()) {
            String city = mover.getServiceCity().toLowerCase();
            requests = requests.stream()
                    .filter(r -> r.getFromLocation().toLowerCase().contains(city) || 
                                 r.getToLocation().toLowerCase().contains(city))
                    .toList();
        }
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/vendor/my")
    public ResponseEntity<List<MovingRequest>> getVendorRequests(Authentication auth) {
        User mover = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(movingRequestRepository.findByMoverOrderByCreatedAtDesc(mover));
    }

    @PutMapping("/vendor/{id}/accept")
    public ResponseEntity<MovingRequest> acceptRequest(@PathVariable Long id, Authentication auth) {
        User mover = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        MovingRequest request = movingRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (!request.getStatus().equals("PENDING")) {
            throw new RuntimeException("Request is already assigned");
        }
        if (!"APPROVED".equals(mover.getKycStatus())) {
            throw new RuntimeException("You must be a verified partner (Approved KYC) to accept jobs. Contact Admin.");
        }
        
        request.setMover(mover);
        request.setStatus("ASSIGNED");
        MovingRequest saved = movingRequestRepository.save(request);

        // Notify the customer that a mover has been assigned
        notificationService.createNotification(
                request.getUser().getEmail(),
                "👍 Great news! Your moving request has been assigned to " + mover.getName() + ". They will contact you shortly.",
                "SYSTEM"
        );

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/vendor/{id}/complete")
    public ResponseEntity<MovingRequest> completeRequest(@PathVariable Long id, Authentication auth) {
        User mover = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        MovingRequest request = movingRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (request.getMover() == null || !request.getMover().getId().equals(mover.getId())) {
            throw new RuntimeException("You are not assigned to this request");
        }
        
        request.setStatus("COMPLETED");
        MovingRequest saved = movingRequestRepository.save(request);

        // Notify user the move is complete
        notificationService.createNotification(
                request.getUser().getEmail(),
                "✅ Your move from " + request.getFromLocation() + " to " + request.getToLocation() + " is complete! We hope it went smoothly.",
                "SYSTEM"
        );

        return ResponseEntity.ok(saved);
    }
}
