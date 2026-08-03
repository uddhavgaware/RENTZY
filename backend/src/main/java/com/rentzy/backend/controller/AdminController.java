package com.rentzy.backend.controller;

import com.rentzy.backend.domain.Listing;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.ListingRepository;
import com.rentzy.backend.repository.MovingRequestRepository;
import com.rentzy.backend.repository.UserRepository;
import com.rentzy.backend.repository.RoommateRequestRepository;
import com.rentzy.backend.repository.RoommatePostRepository;
import com.rentzy.backend.service.BookingService;
import com.rentzy.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.time.YearMonth;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final BookingService bookingService;
    private final com.rentzy.backend.service.EmailService emailService;
    private final MovingRequestRepository movingRequestRepository;
    private final NotificationService notificationService;
    private final RoommateRequestRepository roommateRequestRepository;
    private final RoommatePostRepository roommatePostRepository;
    private final com.rentzy.backend.repository.BookingRepository bookingRepository;
    private final com.rentzy.backend.service.ProfileReminderService profileReminderService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findByIsDeletedFalse());
    }

    // Bulk delete users
    @PostMapping("/users/bulk-delete")
    public ResponseEntity<?> bulkDeleteUsers(@RequestBody Map<String, Object> payload) {
        if (payload.containsKey("all") && (Boolean) payload.get("all")) {
            List<User> users = userRepository.findAll();
            List<User> nonAdmins = users.stream()
                    .filter(u -> u.getRole() != User.Role.ADMIN)
                    .collect(Collectors.toList());
            userRepository.deleteAll(nonAdmins);
            return ResponseEntity.ok(Map.of("message", "All non-admin users deleted successfully"));
        } else if (payload.containsKey("userIds")) {
            @SuppressWarnings("unchecked")
            List<Integer> ids = (List<Integer>) payload.get("userIds");
            List<Long> longIds = ids.stream().map(Integer::longValue).collect(Collectors.toList());
            List<User> usersToDelete = userRepository.findAllById(longIds).stream()
                    .filter(u -> u.getRole() != User.Role.ADMIN)
                    .collect(Collectors.toList());
            userRepository.deleteAll(usersToDelete);
            return ResponseEntity.ok(Map.of("message", "Selected users deleted successfully"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Invalid payload"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @RequestParam(required = false) String reason) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        // Send notification email before deleting
        try {
            emailService.sendAdminActionEmail(user.getEmail(), "DELETED", reason);
        } catch (Exception ignored) {}
        // Nullify mover references so other users' requests aren't lost
        movingRequestRepository.findByMoverOrderByCreatedAtDesc(user).forEach(req -> {
            req.setMover(null);
            req.setStatus("PENDING");
            movingRequestRepository.save(req);
        });
        // Hard delete — cascades to listings, bookings, reviews, etc.
        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @PostMapping("/users/{id}/undo-delete")
    public ResponseEntity<User> undoDeleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsDeleted(false);
        user.setDeleteRequested(false);
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PostMapping("/users/{id}/cancel-delete-request")
    public ResponseEntity<User> cancelDeleteRequest(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setDeleteRequested(false);
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PostMapping("/users/{id}/kyc/approve")
    public ResponseEntity<User> approveKyc(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setKycStatus("APPROVED");
        user.setIsVerified(true);
        User saved = userRepository.save(user);

        // Notify user that KYC was approved
        notificationService.createNotification(
                user.getEmail(),
                "✅ Congratulations! Your KYC has been approved. Your account is now Verified — the verified badge will appear on your listings.",
                "SYSTEM"
        );
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/users/{id}/kyc/reject")
    public ResponseEntity<User> rejectKyc(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setKycStatus("REJECTED");
        user.setIsVerified(false);
        User saved = userRepository.save(user);

        // Notify user that KYC was rejected
        notificationService.createNotification(
                user.getEmail(),
                "❌ Your KYC submission was rejected. Please ensure the document is clearly visible and the details are accurate, then resubmit.",
                "SYSTEM"
        );
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/users/{id}/kyc/undo")
    public ResponseEntity<User> undoKyc(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setKycStatus("PENDING");
        user.setIsVerified(false);
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PostMapping("/users/{id}/block")
    public ResponseEntity<User> toggleBlockUser(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        boolean blocking = user.getIsBlocked() == null || !user.getIsBlocked();
        user.setIsBlocked(blocking);
        
        if (blocking && body != null && body.containsKey("reason")) {
            emailService.sendAdminActionEmail(user.getEmail(), "BLOCKED", body.get("reason"));
        }
        
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PostMapping("/users/{id}/warn")
    public ResponseEntity<Void> warnUser(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        String reason = (body != null && body.containsKey("reason")) ? body.get("reason") : "Violation of policies.";
        
        emailService.sendAdminActionEmail(user.getEmail(), "WARNING", reason);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{id}/make-admin")
    public ResponseEntity<?> makeAdmin(@PathVariable Long id) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!"uddhavgaware80@gmail.com".equalsIgnoreCase(currentEmail)) {
            return ResponseEntity.status(403).body(Map.of("message", "Only the Head Admin can promote users to Admin."));
        }
        
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(User.Role.ADMIN);
        return ResponseEntity.ok(userRepository.save(user));
    }

    @GetMapping("/listings")
    public ResponseEntity<List<Listing>> getAllListings() {
        return ResponseEntity.ok(listingRepository.findAll());
    }

    @DeleteMapping("/listings/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable Long id) {
        listingRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/moving/{id}")
    public ResponseEntity<Void> deleteMovingRequest(@PathVariable Long id) {
        movingRequestRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/roommates/{id}")
    public ResponseEntity<Void> deleteRoommateRequest(@PathVariable Long id) {
        roommateRequestRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/roommate-posts/all")
    public ResponseEntity<Map<String, String>> deleteAllRoommatePosts() {
        roommateRequestRepository.deleteAll(); // Delete requests first due to FK constraints
        roommatePostRepository.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All roommate posts and requests deleted successfully"));
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/bookings")
    public ResponseEntity<?> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(Map.of(
            "users", userRepository.count(),
            "listings", listingRepository.count(),
            "bookings", (long) bookingService.getAllBookings().size()
        ));
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalyticsData() {
        List<User> allUsers = userRepository.findAll();
        List<com.rentzy.backend.domain.Booking> allBookings = bookingService.getAllBookings();
        List<Listing> allListings = listingRepository.findAll();
        
        // Generate trend data for last 6 months
        List<Map<String, Object>> growthData = new ArrayList<>();
        YearMonth currentMonth = YearMonth.now();
        double totalRevenue = 0;
        
        for (int i = 5; i >= 0; i--) {
            YearMonth targetMonth = currentMonth.minusMonths(i);
            String monthName = targetMonth.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH);
            
            long usersInMonth = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null && YearMonth.from(u.getCreatedAt()).equals(targetMonth))
                .count();
                
            double revenueInMonth = allBookings.stream()
                .filter(b -> b.getCreatedAt() != null && YearMonth.from(b.getCreatedAt()).equals(targetMonth))
                .mapToDouble(b -> b.getAmount() != null ? b.getAmount() : 0)
                .sum();
                
            totalRevenue += revenueInMonth;
            
            growthData.add(Map.of(
                "month", monthName,
                "users", usersInMonth,
                "revenue", revenueInMonth
            ));
        }

        // Calculate property types breakdown - values must match PostPropertyPage form options
        long flats = allListings.stream().filter(l -> "Flat".equalsIgnoreCase(l.getType())).count();
        long pgs = allListings.stream().filter(l -> "PG".equalsIgnoreCase(l.getType())).count();
        long villas = allListings.stream().filter(l -> "Villa".equalsIgnoreCase(l.getType())).count();
        long hostels = allListings.stream().filter(l -> "Hostel".equalsIgnoreCase(l.getType())).count();
        long apartments = allListings.stream().filter(l -> "Apartment".equalsIgnoreCase(l.getType())).count();
        long independentHouses = allListings.stream().filter(l -> "Independent House".equalsIgnoreCase(l.getType())).count();
        long colivingSpaces = allListings.stream().filter(l -> "Co-living Space".equalsIgnoreCase(l.getType())).count();

        List<Map<String, Object>> propertyTypes = new ArrayList<>();
        if (flats > 0) propertyTypes.add(Map.<String, Object>of("name", "Flats", "value", flats));
        if (pgs > 0) propertyTypes.add(Map.<String, Object>of("name", "PGs", "value", pgs));
        if (villas > 0) propertyTypes.add(Map.<String, Object>of("name", "Villas", "value", villas));
        if (hostels > 0) propertyTypes.add(Map.<String, Object>of("name", "Hostels", "value", hostels));
        if (apartments > 0) propertyTypes.add(Map.<String, Object>of("name", "Apartments", "value", apartments));
        if (independentHouses > 0) propertyTypes.add(Map.<String, Object>of("name", "Independent Houses", "value", independentHouses));
        if (colivingSpaces > 0) propertyTypes.add(Map.<String, Object>of("name", "Co-living Spaces", "value", colivingSpaces));

        if (propertyTypes.isEmpty()) {
            propertyTypes.add(Map.<String, Object>of("name", "No Listings Yet", "value", 1L));
        }

        // Live Real-Time & Active Users Metrics
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fifteenMinsAgo = now.minusMinutes(15);
        LocalDateTime oneDayAgo = now.minusHours(24);
        LocalDateTime sevenDaysAgo = now.minusDays(7);
        LocalDateTime thirtyDaysAgo = now.minusDays(30);

        long liveUsersCount = allUsers.stream()
            .filter(u -> u.getLastActiveAt() != null && u.getLastActiveAt().isAfter(fifteenMinsAgo))
            .count();

        long dauCount = allUsers.stream()
            .filter(u -> (u.getLastActiveAt() != null && u.getLastActiveAt().isAfter(oneDayAgo)) ||
                         (u.getCreatedAt() != null && u.getCreatedAt().isAfter(oneDayAgo)))
            .count();

        long wauCount = allUsers.stream()
            .filter(u -> (u.getLastActiveAt() != null && u.getLastActiveAt().isAfter(sevenDaysAgo)) ||
                         (u.getCreatedAt() != null && u.getCreatedAt().isAfter(sevenDaysAgo)))
            .count();

        long mauCount = allUsers.stream()
            .filter(u -> (u.getLastActiveAt() != null && u.getLastActiveAt().isAfter(thirtyDaysAgo)) ||
                         (u.getCreatedAt() != null && u.getCreatedAt().isAfter(thirtyDaysAgo)))
            .count();

        // Daily active users trend (last 7 days)
        List<Map<String, Object>> dailyTrend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = now.minusDays(i).toLocalDate().atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1);
            String dayLabel = dayStart.getDayOfWeek().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH);

            long activeOnDay = allUsers.stream()
                .filter(u -> (u.getLastActiveAt() != null && u.getLastActiveAt().isAfter(dayStart) && u.getLastActiveAt().isBefore(dayEnd)) ||
                             (u.getCreatedAt() != null && u.getCreatedAt().isAfter(dayStart) && u.getCreatedAt().isBefore(dayEnd)))
                .count();

            dailyTrend.add(Map.of("day", dayLabel, "activeUsers", activeOnDay));
        }

        // Referral & Campaign Link tracking statistics
        Map<String, Map<String, Object>> referralCampaigns = new HashMap<>();

        for (User u : allUsers) {
            String ref = u.getReferralCode();
            if (ref != null && !ref.trim().isEmpty()) {
                referralCampaigns.putIfAbsent(ref, new HashMap<>(Map.of(
                    "code", ref,
                    "totalSignups", 0L,
                    "studentsCount", 0L,
                    "ownersCount", 0L
                )));

                Map<String, Object> camp = referralCampaigns.get(ref);
                camp.put("totalSignups", (Long) camp.get("totalSignups") + 1);
                if ((u.getCollegeName() != null && !u.getCollegeName().isEmpty()) || "TENANT".equalsIgnoreCase(u.getRole().name())) {
                    camp.put("studentsCount", (Long) camp.get("studentsCount") + 1);
                }
                if ("OWNER".equalsIgnoreCase(u.getRole().name())) {
                    camp.put("ownersCount", (Long) camp.get("ownersCount") + 1);
                }
            }
        }

        return ResponseEntity.ok(Map.of(
            "growth", growthData,
            "propertyTypes", propertyTypes,
            "totalRevenue", totalRevenue,
            "liveUsers", liveUsersCount,
            "dau", dauCount,
            "wau", wauCount,
            "mau", mauCount,
            "dailyTrend", dailyTrend,
            "referralCampaigns", new ArrayList<>(referralCampaigns.values())
        ));
    }

    // ─── Demo/Test Endpoints for Profile Reminder Emails ─────────────────────────

    /**
     * Immediately triggers the full scheduled reminder job.
     * Useful for testing — sends emails to ALL users with incomplete profiles.
     * Only ADMIN can call this.
     */
    @PostMapping("/reminders/trigger")
    public ResponseEntity<?> triggerReminderJob() {
        String callerEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User caller = userRepository.findByEmail(callerEmail).orElse(null);
        if (caller == null || caller.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        profileReminderService.sendProfileCompletionReminders();
        return ResponseEntity.ok(Map.of("message", "✅ Reminder job triggered! Emails sent to all eligible users."));
    }

    /**
     * Sends a demo reminder email to a specific email address for preview.
     * Only ADMIN can call this.
     */
    @PostMapping("/reminders/test")
    public ResponseEntity<?> sendTestReminderEmail(@RequestBody Map<String, String> body) {
        String callerEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User caller = userRepository.findByEmail(callerEmail).orElse(null);
        if (caller == null || caller.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        String targetEmail = body.get("email");
        if (targetEmail == null || targetEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "email field is required"));
        }
        // Create a fake incomplete user with the target email for demo
        User demoUser = new User();
        demoUser.setName("Demo User");
        demoUser.setEmail(targetEmail);
        demoUser.setProfileCompleted(false);
        profileReminderService.sendDemoEmail(demoUser);
        return ResponseEntity.ok(Map.of("message", "✅ Demo reminder email sent to " + targetEmail));
    }
}
