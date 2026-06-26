package com.rentzy.backend.controller;

import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.UserRepository;
import com.rentzy.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final com.rentzy.backend.security.JwtService jwtService;
    private final NotificationService notificationService;

    // Get current user profile
    @GetMapping("/me")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(Map.ofEntries(
                Map.entry("id", user.getId()),
                Map.entry("userCode", user.getUserCode() != null ? user.getUserCode() : ""),
                Map.entry("name", user.getName() != null ? user.getName() : ""),
                Map.entry("email", user.getEmail() != null ? user.getEmail() : ""),
                Map.entry("role", user.getRole().name()),
                Map.entry("phone", user.getPhone() != null ? user.getPhone() : ""),
                Map.entry("dob", user.getDob() != null ? user.getDob() : ""),
                Map.entry("gender", user.getGender() != null ? user.getGender() : ""),
                Map.entry("occupation", user.getOccupation() != null ? user.getOccupation() : ""),
                Map.entry("profilePhoto", user.getProfilePhoto() != null ? user.getProfilePhoto() : ""),
                Map.entry("profileCompleted", user.getProfileCompleted() != null ? user.getProfileCompleted() : false),
                Map.entry("educationLevel", user.getEducationLevel() != null ? user.getEducationLevel() : ""),
                Map.entry("collegeName", user.getCollegeName() != null ? user.getCollegeName() : ""),
                Map.entry("courseName", user.getCourseName() != null ? user.getCourseName() : ""),
                Map.entry("currentYear", user.getCurrentYear() != null ? user.getCurrentYear() : ""),
                Map.entry("companyName", user.getCompanyName() != null ? user.getCompanyName() : ""),
                Map.entry("jobRole", user.getJobRole() != null ? user.getJobRole() : ""),
                Map.entry("businessDescription", user.getBusinessDescription() != null ? user.getBusinessDescription() : ""),
                Map.entry("serviceCity", user.getServiceCity() != null ? user.getServiceCity() : ""),
                Map.entry("city", user.getCity() != null ? user.getCity() : ""),
                Map.entry("upiId", user.getUpiId() != null ? user.getUpiId() : ""),
                Map.entry("upiQrUrl", user.getUpiQrUrl() != null ? user.getUpiQrUrl() : ""),
                Map.entry("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""),
                Map.entry("kycStatus", user.getKycStatus()),
                Map.entry("kycDocumentUrl", user.getKycDocumentUrl() != null ? user.getKycDocumentUrl() : ""),
                Map.entry("kycDocumentType", user.getKycDocumentType() != null ? user.getKycDocumentType() : ""),
                Map.entry("kycDocumentNumber", user.getKycDocumentNumber() != null ? user.getKycDocumentNumber() : ""),
                Map.entry("isVerified", user.getIsVerified() != null ? user.getIsVerified() : false),
                Map.entry("contactShared", user.getContactShared() != null ? user.getContactShared() : false)
        ));
    }

    // Submit KYC Document
    @PostMapping("/kyc")
    public ResponseEntity<?> submitKyc(@RequestBody Map<String, String> body, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!body.containsKey("documentUrl") || body.get("documentUrl").trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Document URL is required"));
        }

        user.setKycDocumentUrl(body.get("documentUrl"));
        
        if (body.containsKey("documentType")) {
            user.setKycDocumentType(body.get("documentType"));
        }
        if (body.containsKey("documentNumber")) {
            user.setKycDocumentNumber(body.get("documentNumber"));
        }
        
        user.setKycStatus("PENDING");
        userRepository.save(user);

        // Notify the user that their KYC is under review
        notificationService.createNotification(
                user.getEmail(),
                "📋 Your KYC document has been submitted and is under review. You'll hear back in 2–3 working days.",
                "SYSTEM"
        );

        return ResponseEntity.ok(Map.of("message", "KYC Document submitted successfully", "kycStatus", "PENDING"));
    }

    // Update current user profile
    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (body.containsKey("name")) user.setName(body.get("name"));
        if (body.containsKey("phone") && body.get("phone") != null && !body.get("phone").isEmpty() && !body.get("phone").equals(user.getPhone())) {
            String newPhone = body.get("phone");
            if (userRepository.findByPhone(newPhone).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Phone number is already in use by another account."));
            }
            user.setPhone(newPhone);
        }
        if (body.containsKey("dob")) user.setDob(body.get("dob"));
        if (body.containsKey("gender")) user.setGender(body.get("gender"));
        if (body.containsKey("occupation")) user.setOccupation(body.get("occupation"));
        if (body.containsKey("profilePhoto")) user.setProfilePhoto(body.get("profilePhoto"));
        
        if (body.containsKey("educationLevel")) user.setEducationLevel(body.get("educationLevel"));
        if (body.containsKey("collegeName")) user.setCollegeName(body.get("collegeName"));
        if (body.containsKey("courseName")) user.setCourseName(body.get("courseName"));
        if (body.containsKey("currentYear")) user.setCurrentYear(body.get("currentYear"));
        if (body.containsKey("companyName")) user.setCompanyName(body.get("companyName"));
        if (body.containsKey("jobRole")) user.setJobRole(body.get("jobRole"));
        if (body.containsKey("businessDescription")) user.setBusinessDescription(body.get("businessDescription"));
        if (body.containsKey("serviceCity")) user.setServiceCity(body.get("serviceCity"));
        if (body.containsKey("city")) user.setCity(body.get("city"));
        if (body.containsKey("upiId")) user.setUpiId(body.get("upiId"));
        if (body.containsKey("upiQrUrl")) user.setUpiQrUrl(body.get("upiQrUrl"));
        if (body.containsKey("contactShared")) user.setContactShared(Boolean.parseBoolean(String.valueOf(body.get("contactShared"))));

        if (body.containsKey("role")) {
            try {
                User.Role newRole = User.Role.valueOf(body.get("role").toUpperCase());
                if (newRole != User.Role.ADMIN) { // Prevent privilege escalation
                    user.setRole(newRole);
                }
            } catch (IllegalArgumentException e) {
                // Ignore invalid role strings
            }
        }
        
        String newToken = null;
        if (body.containsKey("email") && !body.get("email").equals(user.getEmail())) {
            String newEmail = body.get("email");
            if (userRepository.findByEmail(newEmail).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email is already in use by another account."));
            }
            user.setEmail(newEmail);
            
            // Generate new token since email (username) has changed
            var extraClaims = new java.util.HashMap<String, Object>();
            extraClaims.put("role", user.getRole().name());
            extraClaims.put("name", user.getName());
            newToken = jwtService.generateToken(extraClaims, user);
        }
        
        // Mark profile as completed once updated
        user.setProfileCompleted(true);

        userRepository.save(user);
        
        return ResponseEntity.ok(Map.ofEntries(
                Map.entry("id", user.getId()),
                Map.entry("name", user.getName() != null ? user.getName() : ""),
                Map.entry("email", user.getEmail() != null ? user.getEmail() : ""),
                Map.entry("role", user.getRole().name()),
                Map.entry("phone", user.getPhone() != null ? user.getPhone() : ""),
                Map.entry("dob", user.getDob() != null ? user.getDob() : ""),
                Map.entry("gender", user.getGender() != null ? user.getGender() : ""),
                Map.entry("occupation", user.getOccupation() != null ? user.getOccupation() : ""),
                Map.entry("profilePhoto", user.getProfilePhoto() != null ? user.getProfilePhoto() : ""),
                Map.entry("profileCompleted", user.getProfileCompleted() != null ? user.getProfileCompleted() : false),
                Map.entry("educationLevel", user.getEducationLevel() != null ? user.getEducationLevel() : ""),
                Map.entry("collegeName", user.getCollegeName() != null ? user.getCollegeName() : ""),
                Map.entry("courseName", user.getCourseName() != null ? user.getCourseName() : ""),
                Map.entry("currentYear", user.getCurrentYear() != null ? user.getCurrentYear() : ""),
                Map.entry("companyName", user.getCompanyName() != null ? user.getCompanyName() : ""),
                Map.entry("jobRole", user.getJobRole() != null ? user.getJobRole() : ""),
                Map.entry("businessDescription", user.getBusinessDescription() != null ? user.getBusinessDescription() : ""),
                Map.entry("serviceCity", user.getServiceCity() != null ? user.getServiceCity() : ""),
                Map.entry("city", user.getCity() != null ? user.getCity() : ""),
                Map.entry("upiId", user.getUpiId() != null ? user.getUpiId() : ""),
                Map.entry("upiQrUrl", user.getUpiQrUrl() != null ? user.getUpiQrUrl() : ""),
                Map.entry("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : ""),
                Map.entry("kycStatus", user.getKycStatus()),
                Map.entry("kycDocumentUrl", user.getKycDocumentUrl() != null ? user.getKycDocumentUrl() : ""),
                Map.entry("isVerified", user.getIsVerified() != null ? user.getIsVerified() : false),
                Map.entry("message", "Profile updated successfully"),
                Map.entry("token", newToken != null ? newToken : "")
        ));
    }

    // Get admin contact info — used by the floating support button
    @GetMapping("/admin")
    public ResponseEntity<?> getAdminContact() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ADMIN)
                .findFirst()
                .map(admin -> ResponseEntity.ok(Map.of(
                        "id", admin.getId(),
                        "name", admin.getName() != null ? admin.getName() : "Support"
                )))
                .orElse(ResponseEntity.ok(Map.of("id", 1L, "name", "Support")));
    }

    // Get public user profile by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", user.getId());
        response.put("userCode", user.getUserCode() != null ? user.getUserCode() : "");
        response.put("name", user.getName() != null ? user.getName() : "Unknown User");
        response.put("role", user.getRole().name());
        response.put("profilePhoto", user.getProfilePhoto() != null ? user.getProfilePhoto() : "");
        response.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        response.put("upiId", user.getUpiId() != null ? user.getUpiId() : "");
        response.put("upiQrUrl", user.getUpiQrUrl() != null ? user.getUpiQrUrl() : "");
        response.put("kycStatus", user.getKycStatus());
        
        if (Boolean.TRUE.equals(user.getContactShared())) {
            response.put("email", user.getEmail());
            response.put("phone", user.getPhone());
        }
        
        return ResponseEntity.ok(response);
    }

    // Search users by name or 10-digit userCode
    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@org.springframework.web.bind.annotation.RequestParam String q) {
        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        String query = q.trim();
        var results = userRepository.findTop10ByNameContainingIgnoreCaseOrUserCodeContaining(query, query);
        var mapped = results.stream().map(u -> Map.ofEntries(
                Map.entry("id", u.getId()),
                Map.entry("userCode", u.getUserCode() != null ? u.getUserCode() : ""),
                Map.entry("name", u.getName() != null ? u.getName() : "Unknown"),
                Map.entry("role", u.getRole().name()),
                Map.entry("profilePhoto", u.getProfilePhoto() != null ? u.getProfilePhoto() : ""),
                Map.entry("kycStatus", u.getKycStatus())
        )).toList();
        return ResponseEntity.ok(mapped);
    }

    // Request account deletion
    @PostMapping("/request-delete")
    public ResponseEntity<?> requestDelete(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.substring(7);
            String email = jwtService.extractUsername(jwt);
            User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
            user.setDeleteRequested(true);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Account deletion request submitted. An admin will process it shortly."));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
    }
}
