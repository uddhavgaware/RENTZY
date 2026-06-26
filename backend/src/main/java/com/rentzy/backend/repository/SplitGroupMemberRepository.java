package com.rentzy.backend.repository;

import com.rentzy.backend.domain.SplitGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SplitGroupMemberRepository extends JpaRepository<SplitGroupMember, Long> {
    List<SplitGroupMember> findByGroupId(Long groupId);
    Optional<SplitGroupMember> findByGroupIdAndUserId(Long groupId, Long userId);
    boolean existsByGroupIdAndUserId(Long groupId, Long userId);
}
