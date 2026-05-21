package com.rentzy.backend.repository;

import com.rentzy.backend.domain.UserReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserReviewRepository extends JpaRepository<UserReview, Long> {
    List<UserReview> findByReviewedUserIdOrderByCreatedAtDesc(Long reviewedUserId);
    Optional<UserReview> findByReviewerEmailAndReviewedUserId(String email, Long reviewedUserId);
    
    @Query("SELECT AVG(r.rating) FROM UserReview r WHERE r.reviewedUser.id = :reviewedUserId")
    Double findAverageRatingByReviewedUserId(Long reviewedUserId);
    
    Long countByReviewedUserId(Long reviewedUserId);
}
