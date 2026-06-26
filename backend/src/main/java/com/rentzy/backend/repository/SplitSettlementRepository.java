package com.rentzy.backend.repository;

import com.rentzy.backend.domain.SplitSettlement;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SplitSettlementRepository extends JpaRepository<SplitSettlement, Long> {
    
    @EntityGraph(attributePaths = {"fromUser", "toUser"})
    List<SplitSettlement> findByGroupIdOrderByDateDesc(Long groupId);
}
