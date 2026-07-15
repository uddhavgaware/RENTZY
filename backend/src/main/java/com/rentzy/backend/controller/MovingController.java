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
    public ResponseEntity<?> createRequest(@RequestBody Map<String, Object> body, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        MovingRequest request = new MovingRequest();
        request.setUser(user);
        request.setFromLocation((String) body.get("fromLocation"));
        request.setToLocation((String) body.get("toLocation"));
        request.setMovingDate((String) body.get("movingDate"));
        request.setMovingTime((String) body.get("movingTime"));
        request.setPropertySize((String) body.get("propertySize"));
        request.setAdditionalNotes((String) body.get("additionalNotes"));
        request.setStatus("PENDING");

        if (body.get("fromLatitude") != null) request.setFromLatitude(Double.parseDouble(body.get("fromLatitude").toString()));
        if (body.get("fromLongitude") != null) request.setFromLongitude(Double.parseDouble(body.get("fromLongitude").toString()));
        if (body.get("toLatitude") != null) request.setToLatitude(Double.parseDouble(body.get("toLatitude").toString()));
        if (body.get("toLongitude") != null) request.setToLongitude(Double.parseDouble(body.get("toLongitude").toString()));
        
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
        if (!request.getStatus().equals("PENDING") && !request.getStatus().equals("ASSIGNED")) {
            throw new RuntimeException("Only pending or assigned requests can be cancelled");
        }
        
        // Notify the vendor if they were already assigned
        if (request.getStatus().equals("ASSIGNED") && request.getMover() != null) {
            notificationService.createNotification(
                    request.getMover().getEmail(),
                    "The customer cancelled the moving request.",
                    "SYSTEM"
            );
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
    public ResponseEntity<MovingRequest> updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        MovingRequest request = movingRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        request.setStatus((String) body.get("status"));
        if (body.containsKey("estimatedPrice") && body.get("estimatedPrice") != null) {
            request.setEstimatedPrice(Double.parseDouble(body.get("estimatedPrice").toString()));
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

        // 🔒 FRAUD PREVENTION: Block acceptance while already on an active job
        List<MovingRequest> activeMoverJobs = movingRequestRepository.findByMoverOrderByCreatedAtDesc(mover);
        boolean hasActiveJob = activeMoverJobs.stream()
                .anyMatch(j -> "ASSIGNED".equals(j.getStatus()) || "IN_TRANSIT".equals(j.getStatus()));
        if (hasActiveJob) {
            throw new RuntimeException("You already have an active job. You cannot accept a new lead while IN TRANSIT or ASSIGNED to another move. Complete or release your current job first.");
        }
        
        request.setMover(mover);
        request.setStatus("ASSIGNED");
        
        // Generate random 4-digit OTPs
        java.util.Random rnd = new java.util.Random();
        request.setStartOtp(String.format("%04d", rnd.nextInt(10000)));
        request.setEndOtp(String.format("%04d", rnd.nextInt(10000)));

        MovingRequest saved = movingRequestRepository.save(request);

        // Notify the customer that a mover has been assigned
        notificationService.createNotification(
                request.getUser().getEmail(),
                "👍 Great news! Your moving request has been assigned to " + mover.getName() + ". They will contact you shortly.",
                "SYSTEM"
        );

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/vendor/{id}/release")
    public ResponseEntity<MovingRequest> releaseRequest(@PathVariable Long id, Authentication auth) {
        User mover = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        MovingRequest request = movingRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (request.getMover() == null || !request.getMover().getId().equals(mover.getId())) {
            throw new RuntimeException("You are not assigned to this request");
        }
        if (!"ASSIGNED".equals(request.getStatus())) {
            throw new RuntimeException("Move is not in ASSIGNED state");
        }
        
        request.setMover(null);
        request.setStatus("PENDING");
        
        MovingRequest saved = movingRequestRepository.save(request);

        // Notify the customer
        notificationService.createNotification(
                request.getUser().getEmail(),
                "The assigned vendor has released the job. Your request is back in the pool for other vendors.",
                "SYSTEM"
        );

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/vendor/{id}/verify-start")
    public ResponseEntity<MovingRequest> verifyStartOtp(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        User mover = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        MovingRequest request = movingRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (request.getMover() == null || !request.getMover().getId().equals(mover.getId())) {
            throw new RuntimeException("You are not assigned to this request");
        }
        if (!"ASSIGNED".equals(request.getStatus())) {
            throw new RuntimeException("Move is not in ASSIGNED state");
        }
        
        String submittedOtp = body.get("otp");
        if (submittedOtp == null || !submittedOtp.trim().equals(request.getStartOtp())) {
            throw new RuntimeException("Invalid Start OTP");
        }
        
        request.setStatus("IN_TRANSIT");
        return ResponseEntity.ok(movingRequestRepository.save(request));
    }

    @PostMapping("/vendor/{id}/verify-end")
    public ResponseEntity<MovingRequest> verifyEndOtp(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        User mover = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        MovingRequest request = movingRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (request.getMover() == null || !request.getMover().getId().equals(mover.getId())) {
            throw new RuntimeException("You are not assigned to this request");
        }
        if (!"IN_TRANSIT".equals(request.getStatus())) {
            throw new RuntimeException("Move is not in IN_TRANSIT state");
        }
        
        String submittedOtp = body.get("otp");
        if (submittedOtp == null || !submittedOtp.trim().equals(request.getEndOtp())) {
            throw new RuntimeException("Invalid End OTP");
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

    @PutMapping("/vendor/{id}/location")
    public ResponseEntity<MovingRequest> updateLocation(@PathVariable Long id, @RequestBody Map<String, Double> body, Authentication auth) {
        User mover = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        MovingRequest request = movingRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (request.getMover() == null || !request.getMover().getId().equals(mover.getId())) {
            throw new RuntimeException("You are not assigned to this request");
        }
        if (!"IN_TRANSIT".equals(request.getStatus())) {
            throw new RuntimeException("Live tracking is only available while IN_TRANSIT");
        }
        
        if (body.get("lat") != null) request.setCurrentLatitude(body.get("lat"));
        if (body.get("lng") != null) request.setCurrentLongitude(body.get("lng"));
        
        return ResponseEntity.ok(movingRequestRepository.save(request));
    }

    // Customer reviews the vendor
    @PostMapping("/{id}/review")
    public ResponseEntity<MovingRequest> submitReview(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        MovingRequest request = movingRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        
        if (!request.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only review your own moving requests");
        }
        if (!"COMPLETED".equals(request.getStatus())) {
            throw new RuntimeException("You can only review completed moves");
        }
        
        request.setReviewRating(body.get("rating"));
        request.setReviewComments(body.get("comments"));
        
        return ResponseEntity.ok(movingRequestRepository.save(request));
    }
}
