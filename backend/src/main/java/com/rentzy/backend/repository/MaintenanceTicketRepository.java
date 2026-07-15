package com.rentzy.backend.repository;

import com.rentzy.backend.domain.MaintenanceTicket;
import com.rentzy.backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, Long> {
    List<MaintenanceTicket> findByTenantOrderByCreatedAtDesc(User tenant);
    List<MaintenanceTicket> findByListingOwnerOrderByCreatedAtDesc(User owner);
}
