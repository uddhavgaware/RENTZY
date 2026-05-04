package com.rentzy.backend.repository;

import com.rentzy.backend.domain.RoommatePost;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RoommatePostRepository extends JpaRepository<RoommatePost, Long>, JpaSpecificationExecutor<RoommatePost> {
}
