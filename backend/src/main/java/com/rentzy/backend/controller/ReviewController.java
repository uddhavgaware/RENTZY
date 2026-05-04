package com.rentzy.backend.controller;

import com.rentzy.backend.domain.Listing;
import com.rentzy.backend.domain.Review;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.ListingRepository;
import com.rentzy.backend.repository.ReviewRepository;
import com.rentzy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    // Submit a review (or update existing one)
    @PostMapping("/{listingId}")
    public ResponseEntity<?> submitReview(
            @PathVariable Long listingId,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        Integer rating = (Integer) body.get("rating");
        String comment = (String) body.get("comment");

        if (rating == null || rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 1 and 5"));
        }

        // Check if user already reviewed — update instead
        Review review = reviewRepository.findByUserEmailAndListingId(authentication.getName(), listingId)
                .orElse(Review.builder()
                        .user(user)
                        .listing(listing)
                        .build());

        review.setRating(rating);
        review.setComment(comment);
        Review saved = reviewRepository.save(review);

        return ResponseEntity.ok(saved);
    }

    // Get all reviews for a listing
    @GetMapping("/listing/{listingId}")
    public ResponseEntity<List<Review>> getReviewsForListing(@PathVariable Long listingId) {
        return ResponseEntity.ok(reviewRepository.findByListingIdOrderByCreatedAtDesc(listingId));
    }

    // Get average rating and count for a listing
    @GetMapping("/listing/{listingId}/summary")
    public ResponseEntity<Map<String, Object>> getReviewSummary(@PathVariable Long listingId) {
        Map<String, Object> summary = new HashMap<>();
        Double avg = reviewRepository.findAverageRatingByListingId(listingId);
        Long count = reviewRepository.countByListingId(listingId);
        summary.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0);
        summary.put("totalReviews", count);
        return ResponseEntity.ok(summary);
    }
}
