package com.rentzy.backend.repository;

import com.rentzy.backend.domain.SearchAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SearchAlertRepository extends JpaRepository<SearchAlert, Long> {
    List<SearchAlert> findByLocationIgnoreCaseContainingAndPropertyTypeIgnoreCase(String location, String propertyType);
    List<SearchAlert> findByUserEmail(String email);
    boolean existsByUserEmailAndLocationIgnoreCaseAndPropertyTypeIgnoreCase(String email, String location, String propertyType);
}
