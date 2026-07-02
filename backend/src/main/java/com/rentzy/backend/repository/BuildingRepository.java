package com.rentzy.backend.repository;

import com.rentzy.backend.domain.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BuildingRepository extends JpaRepository<Building, Long> {
    List<Building> findByOwnerEmail(String email);
    List<Building> findByNameContainingIgnoreCase(String name);
    List<Building> findByCityIgnoreCaseAndLocationContainingIgnoreCase(String city, String location);
}
