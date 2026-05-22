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
}
