package com.rentzy.backend.repository;

import com.rentzy.backend.domain.SplitGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SplitGroupRepository extends JpaRepository<SplitGroup, Long> {

    // Find all groups where the user is a member
    @Query("SELECT DISTINCT g FROM SplitGroup g JOIN g.members m WHERE m.user.id = :userId")
    List<SplitGroup> findGroupsByUserId(Long userId);

    // Find all groups created by a specific user
    List<SplitGroup> findByCreatedByIdOrderByCreatedAtDesc(Long userId);
}
