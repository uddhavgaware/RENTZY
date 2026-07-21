package com.rentzy.backend.repository;

import com.rentzy.backend.domain.OwnerProperty;
import com.rentzy.backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OwnerPropertyRepository extends JpaRepository<OwnerProperty, Long> {
    List<OwnerProperty> findByOwnerOrderByCreatedAtDesc(User owner);
    List<OwnerProperty> findByCityIgnoreCase(String city);
}
