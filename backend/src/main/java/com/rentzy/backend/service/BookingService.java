package com.rentzy.backend.service;

import com.rentzy.backend.domain.Booking;
import com.rentzy.backend.domain.Listing;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.BookingRepository;
import com.rentzy.backend.repository.ListingRepository;
import com.rentzy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public Booking createBooking(Long listingId, String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        Booking booking = Booking.builder()
                .tenant(tenant)
                .listing(listing)
                .amount(listing.getPrice())
                .status(Booking.BookingStatus.PENDING)
                .build();
        Booking saved = bookingRepository.save(booking);

        // Notify listing owner
        notificationService.createNotification(
                listing.getOwner().getEmail(),
                "New booking request for '" + listing.getTitle() + "' from " + tenant.getName(),
                "BOOKING",
                "/dashboard"
        );

        return saved;
    }

    public Booking confirmBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        Booking saved = bookingRepository.save(booking);

        // Notify tenant
        notificationService.createNotification(
                booking.getTenant().getEmail(),
                "Your booking for '" + booking.getListing().getTitle() + "' has been confirmed! 🎉",
                "PAYMENT",
                "/dashboard"
        );

        return saved;
    }

    public Booking cancelBooking(Long bookingId, String email) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        // Allow tenant or listing owner to cancel
        boolean isTenant = booking.getTenant().getEmail().equals(email);
        boolean isOwner = booking.getListing().getOwner().getEmail().equals(email);
        if (!isTenant && !isOwner) {
            throw new RuntimeException("Not authorized to cancel this booking");
        }
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        String propertyTitle = booking.getListing().getTitle();
        if (isTenant) {
            // Tenant cancelled → notify owner
            notificationService.createNotification(
                    booking.getListing().getOwner().getEmail(),
                    "❌ " + booking.getTenant().getName() + " cancelled their booking request for '" + propertyTitle + "'.",
                    "BOOKING",
                    "/dashboard"
            );
        } else {
            // Owner cancelled → notify tenant
            notificationService.createNotification(
                    booking.getTenant().getEmail(),
                    "❌ Your booking for '" + propertyTitle + "' was cancelled by the owner.",
                    "BOOKING",
                    "/dashboard"
            );
        }
        return saved;
    }

    public List<Booking> getMyBookings(String email) {
        return bookingRepository.findByTenantEmailOrderByCreatedAtDesc(email);
    }

    public List<Booking> getOwnerBookings(String ownerEmail) {
        return bookingRepository.findByListingOwnerEmailOrderByCreatedAtDesc(ownerEmail);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
}
