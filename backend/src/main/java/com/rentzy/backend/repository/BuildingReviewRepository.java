package com.rentzy.backend.repository;

import com.rentzy.backend.domain.BuildingReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BuildingReviewRepository extends JpaRepository<BuildingReview, Long> {

    List<BuildingReview> findByBuildingIdOrderByCreatedAtDesc(Long buildingId);

    Optional<BuildingReview> findByReviewerEmailAndBuildingId(String email, Long buildingId);

    @Query("SELECT AVG(r.rating) FROM BuildingReview r WHERE r.building.id = :buildingId")
    Double findAverageRatingByBuildingId(@Param("buildingId") Long buildingId);

    Long countByBuildingId(Long buildingId);
}
