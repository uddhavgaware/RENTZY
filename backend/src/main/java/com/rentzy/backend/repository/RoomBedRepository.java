package com.rentzy.backend.repository;

import com.rentzy.backend.domain.OwnerProperty;
import com.rentzy.backend.domain.RoomBed;
import com.rentzy.backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomBedRepository extends JpaRepository<RoomBed, Long> {
    List<RoomBed> findByOwnerPropertyOrderByIdAsc(OwnerProperty ownerProperty);
    List<RoomBed> findByOwnerPropertyOwnerOrderByIdAsc(User owner);
    List<RoomBed> findByTenantOrderByIdAsc(User tenant);
    List<RoomBed> findByStatus(String status);
}
