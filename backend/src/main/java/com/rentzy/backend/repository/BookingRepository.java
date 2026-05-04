package com.rentzy.backend.repository;

import com.rentzy.backend.domain.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByTenantEmail(String email);
    List<Booking> findByTenantEmailOrderByCreatedAtDesc(String email);
    List<Booking> findByListingId(Long listingId);
    List<Booking> findByListingOwnerEmailOrderByCreatedAtDesc(String ownerEmail);
}
