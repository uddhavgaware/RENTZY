package com.rentzy.backend.controller;

import com.rentzy.backend.domain.Booking;
import com.rentzy.backend.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    // Tenant initiates a booking
    @PostMapping("/{listingId}")
    public ResponseEntity<Booking> createBooking(
            @PathVariable Long listingId,
            Authentication authentication) {
        return ResponseEntity.ok(bookingService.createBooking(listingId, authentication.getName()));
    }

    // Simulate payment confirmation
    @PostMapping("/{bookingId}/confirm")
    public ResponseEntity<Booking> confirmBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.confirmBooking(bookingId));
    }

    // Cancel a booking (tenant or owner)
    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<Booking> cancelBooking(
            @PathVariable Long bookingId,
            Authentication authentication) {
        return ResponseEntity.ok(bookingService.cancelBooking(bookingId, authentication.getName()));
    }

    // Tenant views their own bookings
    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getMyBookings(authentication.getName()));
    }

    // Owner views bookings on their properties
    @GetMapping("/owner")
    public ResponseEntity<List<Booking>> getOwnerBookings(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getOwnerBookings(authentication.getName()));
    }
}
