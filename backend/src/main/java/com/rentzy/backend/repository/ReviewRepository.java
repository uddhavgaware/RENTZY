package com.rentzy.backend.repository;

import com.rentzy.backend.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByListingIdOrderByCreatedAtDesc(Long listingId);

    Optional<Review> findByUserEmailAndListingId(String email, Long listingId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.listing.id = :listingId")
    Double findAverageRatingByListingId(@Param("listingId") Long listingId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.listing.id = :listingId")
    Long countByListingId(@Param("listingId") Long listingId);
}
