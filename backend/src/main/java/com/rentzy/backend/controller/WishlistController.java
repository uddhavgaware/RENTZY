package com.rentzy.backend.controller;

import com.rentzy.backend.domain.Listing;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.domain.WishlistItem;
import com.rentzy.backend.repository.ListingRepository;
import com.rentzy.backend.repository.UserRepository;
import com.rentzy.backend.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    // Get all wishlisted listing IDs for the current user (lightweight)
    @GetMapping("/ids")
    public ResponseEntity<List<Long>> getWishlistIds(Authentication authentication) {
        List<Long> ids = wishlistRepository.findByUserEmail(authentication.getName())
                .stream()
                .map(item -> item.getListing().getId())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ids);
    }

    // Get all wishlisted listings with full details
    @GetMapping("/my")
    public ResponseEntity<List<Listing>> getMyWishlist(Authentication authentication) {
        List<Listing> listings = wishlistRepository.findByUserEmail(authentication.getName())
                .stream()
                .map(WishlistItem::getListing)
                .collect(Collectors.toList());
        return ResponseEntity.ok(listings);
    }

    // Toggle wishlist: add if not present, remove if present
    @PostMapping("/{listingId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> toggleWishlist(
            @PathVariable Long listingId,
            Authentication authentication) {
        String email = authentication.getName();
        boolean exists = wishlistRepository.existsByUserEmailAndListingId(email, listingId);

        if (exists) {
            wishlistRepository.deleteByUserEmailAndListingId(email, listingId);
            return ResponseEntity.ok(Map.of("wishlisted", false, "message", "Removed from wishlist"));
        } else {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Listing listing = listingRepository.findById(listingId)
                    .orElseThrow(() -> new RuntimeException("Listing not found"));

            WishlistItem item = WishlistItem.builder()
                    .user(user)
                    .listing(listing)
                    .build();
            wishlistRepository.save(item);
            return ResponseEntity.ok(Map.of("wishlisted", true, "message", "Added to wishlist"));
        }
    }
}
