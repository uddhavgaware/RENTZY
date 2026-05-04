package com.rentzy.backend.repository;

import com.rentzy.backend.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserEmailOrderByCreatedAtDesc(String email);
    Long countByUserEmailAndIsReadFalse(String email);
}
