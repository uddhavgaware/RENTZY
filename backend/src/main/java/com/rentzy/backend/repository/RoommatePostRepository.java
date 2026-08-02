package com.rentzy.backend.repository;

import com.rentzy.backend.domain.RoommatePost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.Nullable;

public interface RoommatePostRepository extends JpaRepository<RoommatePost, Long>, JpaSpecificationExecutor<RoommatePost> {

    @EntityGraph(attributePaths = {"user", "images"})
    Page<RoommatePost> findAll(@Nullable Specification<RoommatePost> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "images"})
    Page<RoommatePost> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "images"})
    java.util.List<RoommatePost> findByUserEmailOrderByIdDesc(String email);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM roommate_post_photos WHERE roommate_post_id = ?1", nativeQuery = true)
    void deleteImagesByPostId(Long id);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM roommate_post_preferences WHERE roommate_post_id = ?1", nativeQuery = true)
    void deletePreferencesByPostId(Long id);
}
