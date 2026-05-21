package com.rentzy.backend.repository;

import com.rentzy.backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByUserCode(String userCode);
    List<User> findByIsDeletedFalse();
    List<User> findTop10ByNameContainingIgnoreCaseOrUserCodeContaining(String name, String userCode);
}
