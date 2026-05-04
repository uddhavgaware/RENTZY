package com.rentzy.backend.controller;

import com.rentzy.backend.domain.Listing;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.ListingRepository;
import com.rentzy.backend.repository.MovingRequestRepository;
import com.rentzy.backend.repository.UserRepository;
import com.rentzy.backend.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
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
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PostMapping("/users/{id}/kyc/approve")
    public ResponseEntity<User> approveKyc(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setKycStatus("APPROVED");
        user.setIsVerified(true);
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PostMapping("/users/{id}/kyc/reject")
    public ResponseEntity<User> rejectKyc(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setKycStatus("REJECTED");
        user.setIsVerified(false);
        return ResponseEntity.ok(userRepository.save(user));
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

    @GetMapping("/listings")
    public ResponseEntity<List<Listing>> getAllListings() {
        return ResponseEntity.ok(listingRepository.findAll());
    }

    @DeleteMapping("/listings/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable Long id) {
        listingRepository.deleteById(id);
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

        return ResponseEntity.ok(Map.of(
            "growth", growthData,
            "propertyTypes", propertyTypes,
            "totalRevenue", totalRevenue
        ));
    }
}
