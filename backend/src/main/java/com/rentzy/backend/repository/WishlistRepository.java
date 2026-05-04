package com.rentzy.backend.repository;

import com.rentzy.backend.domain.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findByUserEmail(String email);
    Optional<WishlistItem> findByUserEmailAndListingId(String email, Long listingId);
    boolean existsByUserEmailAndListingId(String email, Long listingId);
    void deleteByUserEmailAndListingId(String email, Long listingId);
}
