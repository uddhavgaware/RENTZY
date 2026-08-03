package com.rentzy.backend.repository;

import com.rentzy.backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByUserCode(String userCode);
    List<User> findByIsDeletedFalse();
    List<User> findTop10ByNameContainingIgnoreCaseOrUserCodeContaining(String name, String userCode);

    // Find Google-login users with incomplete profiles who haven't been reminded in the last 10 hours
    @Query("SELECT u FROM User u WHERE u.profileCompleted = false AND u.isEmailVerified = true " +
           "AND u.isDeleted = false AND u.isBlocked = false " +
           "AND (u.lastReminderSentAt IS NULL OR u.lastReminderSentAt < :cutoff)")
    List<User> findUsersNeedingProfileReminder(@Param("cutoff") LocalDateTime cutoff);
}
