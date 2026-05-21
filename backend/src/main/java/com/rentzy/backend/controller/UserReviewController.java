package com.rentzy.backend.controller;

import com.rentzy.backend.domain.User;
import com.rentzy.backend.domain.UserReview;
import com.rentzy.backend.repository.UserRepository;
import com.rentzy.backend.repository.UserReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user-reviews")
@RequiredArgsConstructor
public class UserReviewController {

    private final UserReviewRepository userReviewRepository;
    private final UserRepository userRepository;

    @PostMapping("/{reviewedUserId}")
    public ResponseEntity<?> submitReview(
            @PathVariable Long reviewedUserId,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        
        User reviewer = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));
        User reviewedUser = userRepository.findById(reviewedUserId)
                .orElseThrow(() -> new RuntimeException("Reviewed user not found"));

        if (reviewer.getId().equals(reviewedUserId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "You cannot review yourself"));
        }

        Integer rating = (Integer) body.get("rating");
        String comment = (String) body.get("comment");

        if (rating == null || rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 1 and 5"));
        }

        UserReview review = userReviewRepository.findByReviewerEmailAndReviewedUserId(authentication.getName(), reviewedUserId)
                .orElse(UserReview.builder()
                        .reviewer(reviewer)
                        .reviewedUser(reviewedUser)
                        .build());

        review.setRating(rating);
        review.setComment(comment);
        UserReview saved = userReviewRepository.save(review);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/user/{reviewedUserId}")
    public ResponseEntity<List<UserReview>> getReviewsForUser(@PathVariable Long reviewedUserId) {
        return ResponseEntity.ok(userReviewRepository.findByReviewedUserIdOrderByCreatedAtDesc(reviewedUserId));
    }

    @GetMapping("/user/{reviewedUserId}/summary")
    public ResponseEntity<Map<String, Object>> getReviewSummary(@PathVariable Long reviewedUserId) {
        Map<String, Object> summary = new HashMap<>();
        Double avg = userReviewRepository.findAverageRatingByReviewedUserId(reviewedUserId);
        Long count = userReviewRepository.countByReviewedUserId(reviewedUserId);
        summary.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0);
        summary.put("totalReviews", count);
        return ResponseEntity.ok(summary);
    }
}
