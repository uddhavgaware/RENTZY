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

    // ─── Email Blast Endpoint ─────────────────────────────────────────────────

    @PostMapping("/emails/send")
    public ResponseEntity<?> sendEmailBlast(@RequestBody Map<String, String> body) {
        String callerEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User caller = userRepository.findByEmail(callerEmail).orElse(null);
        if (caller == null || caller.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }

        String category = body.getOrDefault("category", "custom");
        String subject  = body.get("subject");
        String msgBody  = body.getOrDefault("body", "");
        String target   = body.getOrDefault("target", "all");
        String specificEmail = body.get("email");

        if (subject == null || subject.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "subject is required"));
        }

        // Resolve recipients
        java.util.List<User> recipients;
        if ("specific".equals(target)) {
            if (specificEmail == null || specificEmail.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "email is required for specific target"));
            }
            User target_user = userRepository.findByEmail(specificEmail).orElse(null);
            if (target_user != null) {
                recipients = java.util.List.of(target_user);
            } else {
                // Still send even if not a registered user (ad-hoc email)
                User ghost = new User();
                ghost.setName("User");
                ghost.setEmail(specificEmail);
                recipients = java.util.List.of(ghost);
            }
        } else if ("incomplete".equals(target)) {
            recipients = userRepository.findUsersNeedingProfileReminder(LocalDateTime.now().minusYears(10));
        } else {
            recipients = userRepository.findByIsDeletedFalse();
        }

        int sent = 0;
        java.util.List<String> errors = new java.util.ArrayList<>();
        for (User recipient : recipients) {
            try {
                String html = buildCategoryEmail(recipient, category, subject, msgBody);
                emailService.sendCustomHtmlEmail(recipient.getEmail(), subject, html);
                sent++;
                System.out.println("[EmailBlast] ✅ Sent to: " + recipient.getEmail());
            } catch (Exception e) {
                String err = recipient.getEmail() + ": " + e.getMessage();
                System.err.println("[EmailBlast] ❌ Failed for " + err);
                errors.add(err);
            }
        }

        if (sent == 0 && !errors.isEmpty()) {
            return ResponseEntity.status(500).body(Map.of(
                "message", "❌ Failed to send emails.",
                "error", errors.get(0),
                "tip", "Check MAIL_USERNAME and MAIL_PASSWORD on Render. Make sure you used a Gmail App Password (not your regular password)."
            ));
        }

        String msg = "✅ Sent to " + sent + " of " + recipients.size() + " recipient(s).";
        if (!errors.isEmpty()) msg += " ⚠️ Failed: " + errors.size() + " — " + errors.get(0);
        return ResponseEntity.ok(Map.of("message", msg));
    }

    private String buildCategoryEmail(User user, String category, String subject, String customBody) {
        String firstName = user.getName() != null ? user.getName().split(" ")[0] : "there";
        String content;
        String headerColor;
        String emoji;

        if (customBody != null && !customBody.isBlank()) {
            content = "<p style='color:#4b5563;font-size:15px;line-height:1.8;margin:0 0 20px;'>"
                    + customBody.replace("\n\n", "</p><p style='color:#4b5563;font-size:15px;line-height:1.8;margin:0 0 20px;'>")
                               .replace("\n", "<br/>")
                    + "</p>";
        } else {
            content = switch (category) {
                case "welcome" ->
                    "<p style='color:#4b5563;font-size:15px;line-height:1.8;margin:0 0 16px;'>We are <strong>genuinely excited</strong> to have you here. RentXY is India's smartest platform to find verified rooms, compatible roommates, and trusted movers — all in one place. 🎉</p>" +
                    "<div style='background:#f8f7ff;border-radius:14px;padding:20px 24px;margin:20px 0;border:1px solid #e0e7ff;'>" +
                      "<p style='color:#4f46e5;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;'>What you can do on RentXY</p>" +
                      "<div style='margin-bottom:12px;'><p style='margin:0;font-size:14px;color:#1e1b4b;font-weight:700;'>🏠 Find Verified Rooms</p><p style='margin:4px 0 0;font-size:13px;color:#6b7280;'>Hundreds of listings across Pune, Mumbai &amp; Bangalore — posted by real owners. No brokers, no fake listings.</p></div>" +
                      "<div style='margin-bottom:12px;'><p style='margin:0;font-size:14px;color:#1e1b4b;font-weight:700;'>🤝 Smart Roommate Matching</p><p style='margin:4px 0 0;font-size:13px;color:#6b7280;'>Our AI compares your lifestyle (sleep, diet, habits) to find you a truly compatible match — not just any roommate.</p></div>" +
                      "<div style='margin-bottom:12px;'><p style='margin:0;font-size:14px;color:#1e1b4b;font-weight:700;'>🚚 Book Trusted Movers</p><p style='margin:4px 0 0;font-size:13px;color:#6b7280;'>Verified movers, real-time tracking, and reviews from the community.</p></div>" +
                      "<div><p style='margin:0;font-size:14px;color:#1e1b4b;font-weight:700;'>💸 Split Expenses Fairly</p><p style='margin:4px 0 0;font-size:13px;color:#6b7280;'>Split rent, electricity, and groceries with your roommates — no awkward conversations needed.</p></div>" +
                    "</div>" +
                    "<div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:20px 0;'>" +
                      "<p style='color:#15803d;font-weight:700;font-size:14px;margin:0 0 6px;'>🔒 Your Privacy is Our Priority</p>" +
                      "<p style='color:#166534;font-size:13px;margin:0;line-height:1.6;'>We collect only what's necessary to give you a better experience. Your data is fully encrypted, <strong>never sold</strong>, and never shared with any third party. Your Google credentials are never stored by us — only your name and email are used for login.</p>" +
                    "</div>" +
                    "<div style='text-align:center;margin:28px 0;'><a href='https://rentxy.in' style='display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(16,185,129,0.35);'>Start Exploring RentXY →</a></div>";

                case "profile_reminder" ->
                    "<p style='color:#4b5563;font-size:15px;line-height:1.8;margin:0 0 16px;'>Your RentXY profile is still <strong>incomplete</strong> — and we'd love to help you get the most out of the platform! A complete profile directly improves the quality of your roommate matches and how quickly owners respond to you. 📋</p>" +
                    "<div style='background:#f8f7ff;border-radius:14px;padding:20px 24px;margin:20px 0;border:1px solid #e0e7ff;'>" +
                      "<p style='color:#4f46e5;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;'>Why we ask for each detail</p>" +
                      "<div style='margin-bottom:14px;border-bottom:1px solid #e0e7ff;padding-bottom:14px;'><p style='margin:0 0 4px;font-size:14px;color:#1e1b4b;font-weight:700;'>📱 Phone Number</p><p style='margin:0;font-size:13px;color:#6b7280;line-height:1.6;'><strong>Why:</strong> Owners and roommates need a direct way to reach you. It also verifies you're a real person, building trust. We never show your number publicly without your permission.</p></div>" +
                      "<div style='margin-bottom:14px;border-bottom:1px solid #e0e7ff;padding-bottom:14px;'><p style='margin:0 0 4px;font-size:14px;color:#1e1b4b;font-weight:700;'>💼 Occupation (Student / Professional / Business)</p><p style='margin:0;font-size:13px;color:#6b7280;line-height:1.6;'><strong>Why:</strong> Many listings are designed for students or working professionals. This helps us show you the most relevant rooms and match you with like-minded roommates.</p></div>" +
                      "<div style='margin-bottom:14px;border-bottom:1px solid #e0e7ff;padding-bottom:14px;'><p style='margin:0 0 4px;font-size:14px;color:#1e1b4b;font-weight:700;'>👤 Gender</p><p style='margin:0;font-size:13px;color:#6b7280;line-height:1.6;'><strong>Why:</strong> Many users (especially women) prefer gender-specific accommodations for safety and comfort. We use this only for filtering results — never for any other purpose.</p></div>" +
                      "<div style='margin-bottom:14px;border-bottom:1px solid #e0e7ff;padding-bottom:14px;'><p style='margin:0 0 4px;font-size:14px;color:#1e1b4b;font-weight:700;'>🎂 Date of Birth</p><p style='margin:0;font-size:13px;color:#6b7280;line-height:1.6;'><strong>Why:</strong> Age group is key for compatibility. A 22-year-old student and a 35-year-old professional have very different schedules and lifestyles. This helps us find truly compatible matches.</p></div>" +
                      "<div><p style='margin:0 0 4px;font-size:14px;color:#1e1b4b;font-weight:700;'>🌙 Lifestyle Preferences (Diet, Sleep, Habits)</p><p style='margin:0;font-size:13px;color:#6b7280;line-height:1.6;'><strong>Why:</strong> This powers our Smart Match AI. The more we know about your lifestyle, the better we match you with someone whose habits align — reducing future conflicts between roommates.</p></div>" +
                    "</div>" +
                    "<div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:20px 0;'>" +
                      "<p style='color:#15803d;font-weight:700;font-size:14px;margin:0 0 4px;'>🔒 100% Safe &amp; Encrypted</p>" +
                      "<p style='color:#166534;font-size:13px;margin:0;'>All this information is stored with end-to-end encryption. We will <strong>NEVER</strong> sell or share your data.</p>" +
                    "</div>" +
                    "<div style='text-align:center;margin:28px 0;'><a href='https://rentxy.in/profile' style='display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(79,70,229,0.35);'>✅ Complete My Profile (2 mins)</a></div>";

                case "security" ->
                    "<p style='color:#4b5563;font-size:15px;line-height:1.8;margin:0 0 16px;'>This is an <strong>official security notice</strong> from the RentXY team. We are reaching out because we noticed some activity on your account and want to ensure everything is safe. 🔒</p>" +
                    "<div style='background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:20px 24px;margin:20px 0;'>" +
                      "<p style='color:#dc2626;font-weight:800;font-size:13px;margin:0 0 12px;'>⚠️ IF THIS WASN'T YOU — Act Now:</p>" +
                      "<p style='color:#7f1d1d;font-size:13px;margin:0 0 6px;line-height:1.6;'>1. Visit <a href='https://rentxy.in/profile' style='color:#dc2626;'>rentxy.in/profile</a> and change your password immediately</p>" +
                      "<p style='color:#7f1d1d;font-size:13px;margin:0 0 6px;line-height:1.6;'>2. Make sure no unknown devices are logged into your account</p>" +
                      "<p style='color:#7f1d1d;font-size:13px;margin:0;line-height:1.6;'>3. Contact us at <a href='mailto:support@rentxy.in' style='color:#dc2626;'>support@rentxy.in</a></p>" +
                    "</div>" +
                    "<div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:20px 24px;margin:20px 0;'>" +
                      "<p style='color:#15803d;font-weight:700;font-size:14px;margin:0 0 12px;'>🔐 How RentXY Protects Your Data</p>" +
                      "<p style='color:#166534;font-size:13px;margin:0 0 6px;'>• All passwords are hashed using BCrypt — <strong>we cannot see your actual password</strong></p>" +
                      "<p style='color:#166534;font-size:13px;margin:0 0 6px;'>• All data is transmitted over HTTPS (encrypted in transit)</p>" +
                      "<p style='color:#166534;font-size:13px;margin:0 0 6px;'>• Your Google login is verified by Google's servers — <strong>we never see your Google password</strong></p>" +
                      "<p style='color:#166534;font-size:13px;margin:0 0 6px;'>• We never store payment card details (handled by Razorpay)</p>" +
                      "<p style='color:#166534;font-size:13px;margin:0;'>• Your personal info is <strong>never sold or shared with advertisers</strong></p>" +
                    "</div>" +
                    "<p style='color:#6b7280;font-size:13px;text-align:center;margin:16px 0 0;'>✅ If this was you — no action needed. Your account is safe.</p>";

                case "promotion" ->
                    "<p style='color:#4b5563;font-size:15px;line-height:1.8;margin:0 0 16px;'>As a valued RentXY member, you've been selected for an <strong>exclusive offer</strong> that we think you'll love! 🎉</p>" +
                    "<div style='background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:14px;padding:24px;text-align:center;margin:20px 0;border:1px solid #fcd34d;'>" +
                      "<p style='font-size:28px;font-weight:900;color:#92400e;margin:0 0 6px;'>🌟 LIMITED TIME OFFER</p>" +
                      "<p style='color:#78350f;font-size:14px;margin:0;font-weight:600;'>Exclusively for early RentXY community members</p>" +
                    "</div>" +
                    "<div style='background:#f8f7ff;border-radius:14px;padding:20px 24px;margin:20px 0;border:1px solid #e0e7ff;'>" +
                      "<p style='color:#4f46e5;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;'>What's included</p>" +
                      "<p style='color:#1e1b4b;font-size:14px;margin:0 0 8px;'>🌟 <strong>Priority listing visibility</strong> — your posts appear at the top of search results</p>" +
                      "<p style='color:#1e1b4b;font-size:14px;margin:0 0 8px;'>🤝 <strong>Unlimited roommate requests</strong> this month — connect with as many people as you want</p>" +
                      "<p style='color:#1e1b4b;font-size:14px;margin:0 0 8px;'>🚀 <strong>Early access to new features</strong> before they launch publicly</p>" +
                      "<p style='color:#1e1b4b;font-size:14px;margin:0;'>🚚 <strong>Discounts on mover bookings</strong> through the RentXY app</p>" +
                    "</div>" +
                    "<p style='color:#4b5563;font-size:14px;line-height:1.7;margin:0 0 20px;'><strong>💬 Why are we offering this?</strong> We want to reward our early community members who helped shape RentXY. Your feedback, usage, and trust in the platform mean everything to us. This is our way of saying <em>thank you</em>.</p>" +
                    "<div style='text-align:center;margin:28px 0;'><a href='https://rentxy.in' style='display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(245,158,11,0.35);'>Claim My Offer Now →</a></div>" +
                    "<p style='color:#9ca3af;font-size:12px;text-align:center;margin:0;'>🔒 No credit card required. No hidden charges. Terms and conditions apply.</p>";

                case "announcement" ->
                    "<p style='color:#4b5563;font-size:15px;line-height:1.8;margin:0 0 16px;'>We've been heads-down building something exciting, and we're finally ready to share it with you. 📢</p>" +
                    "<div style='background:#f8f7ff;border-radius:14px;padding:20px 24px;margin:20px 0;border:1px solid #e0e7ff;'>" +
                      "<p style='color:#4f46e5;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;'>🚀 What's New on RentXY</p>" +
                      "<div style='margin-bottom:14px;'><p style='margin:0 0 4px;font-size:14px;color:#1e1b4b;font-weight:700;'>✅ Smart Match AI Upgrade</p><p style='margin:0;font-size:13px;color:#6b7280;'>Now considers 12+ lifestyle factors (cleanliness, noise tolerance, work-from-home habits) for even better roommate matching.</p></div>" +
                      "<div style='margin-bottom:14px;'><p style='margin:0 0 4px;font-size:14px;color:#1e1b4b;font-weight:700;'>✅ Real-Time Map View</p><p style='margin:0;font-size:13px;color:#6b7280;'>Browse rooms on an interactive map. Click any pin to see photos, rent, split cost — then open it directly in Google Maps.</p></div>" +
                      "<div style='margin-bottom:14px;'><p style='margin:0 0 4px;font-size:14px;color:#1e1b4b;font-weight:700;'>✅ Mover Booking Improvements</p><p style='margin:0;font-size:13px;color:#6b7280;'>Track your moving request in real-time, chat with movers directly, and leave reviews after the move.</p></div>" +
                      "<div><p style='margin:0 0 4px;font-size:14px;color:#1e1b4b;font-weight:700;'>✅ Split Expense Settlements</p><p style='margin:0;font-size:13px;color:#6b7280;'>Settle group expenses within the app — no more manual UPI transfers or confusing spreadsheets.</p></div>" +
                    "</div>" +
                    "<div style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin:20px 0;'>" +
                      "<p style='color:#1d4ed8;font-weight:700;font-size:14px;margin:0 0 4px;'>💬 Your Feedback Shapes RentXY</p>" +
                      "<p style='color:#1e40af;font-size:13px;margin:0;'>Have a suggestion or ran into an issue? Hit reply or use the support chat on rentxy.in — we read every single message.</p>" +
                    "</div>" +
                    "<div style='text-align:center;margin:28px 0;'><a href='https://rentxy.in' style='display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(59,130,246,0.35);'>Explore What's New →</a></div>";

                default -> "<p style='color:#4b5563;font-size:15px;line-height:1.8;'>" + subject + "</p>";
            };
        }

        headerColor = switch (category) {
            case "welcome"          -> "linear-gradient(135deg,#10b981,#059669)";
            case "security"         -> "linear-gradient(135deg,#ef4444,#dc2626)";
            case "promotion"        -> "linear-gradient(135deg,#f59e0b,#d97706)";
            case "announcement"     -> "linear-gradient(135deg,#3b82f6,#2563eb)";
            case "profile_reminder" -> "linear-gradient(135deg,#4f46e5,#7c3aed)";
            default                 -> "linear-gradient(135deg,#64748b,#475569)";
        };
        emoji = switch (category) {
            case "welcome" -> "👋"; case "security" -> "🔒"; case "promotion" -> "🎉";
            case "announcement" -> "📢"; case "profile_reminder" -> "📋"; default -> "✉️";
        };

        return """
            <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
            <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f0f4ff;">
            <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 20px;">
            <tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">
            <tr><td style="background:%s;border-radius:20px 20px 0 0;padding:40px;text-align:center;">
              <div style="font-size:44px;margin-bottom:10px;">%s</div>
              <h1 style="color:#fff;margin:0;font-size:26px;font-weight:800;">RentXY</h1>
              <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">%s</p>
            </td></tr>
            <tr><td style="background:#ffffff;padding:40px;">
              <h2 style="color:#1e1b4b;font-size:20px;margin:0 0 16px;">Hey %s!</h2>
              %s
              <p style="color:#9ca3af;font-size:12px;margin:32px 0 0;border-top:1px solid #f3f4f6;padding-top:20px;">
                © 2025 RentXY · This email was sent to %s · Powered by RentXY Admin
              </p>
            </td></tr>
            </table></td></tr></table></body></html>
            """.formatted(headerColor, emoji, subject, firstName, content, user.getEmail());
    }
}
