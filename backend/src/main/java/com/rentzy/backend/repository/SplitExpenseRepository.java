package com.rentzy.backend.repository;

import com.rentzy.backend.domain.SplitExpense;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SplitExpenseRepository extends JpaRepository<SplitExpense, Long> {
    
    @EntityGraph(attributePaths = {"paidBy", "shares", "shares.user"})
    List<SplitExpense> findByGroupIdOrderByDateDesc(Long groupId);
    
    List<SplitExpense> findByPaidByIdAndGroupId(Long userId, Long groupId);
}
