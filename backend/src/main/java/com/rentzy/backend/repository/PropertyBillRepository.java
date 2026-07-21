package com.rentzy.backend.repository;

import com.rentzy.backend.domain.OwnerProperty;
import com.rentzy.backend.domain.PropertyBill;
import com.rentzy.backend.domain.RoomBed;
import com.rentzy.backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PropertyBillRepository extends JpaRepository<PropertyBill, Long> {
    List<PropertyBill> findByOwnerOrderByCreatedAtDesc(User owner);
    List<PropertyBill> findByTenantOrderByCreatedAtDesc(User tenant);
    List<PropertyBill> findByRoomBedOrderByCreatedAtDesc(RoomBed roomBed);
    List<PropertyBill> findByStatus(String status);
}
