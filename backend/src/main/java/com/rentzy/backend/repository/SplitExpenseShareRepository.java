package com.rentzy.backend.repository;

import com.rentzy.backend.domain.SplitExpenseShare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SplitExpenseShareRepository extends JpaRepository<SplitExpenseShare, Long> {
    List<SplitExpenseShare> findByExpenseId(Long expenseId);
    List<SplitExpenseShare> findByUserId(Long userId);
    void deleteByExpenseId(Long expenseId);
}
