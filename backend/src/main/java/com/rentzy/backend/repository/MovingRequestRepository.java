package com.rentzy.backend.repository;

import com.rentzy.backend.domain.MovingRequest;
import com.rentzy.backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovingRequestRepository extends JpaRepository<MovingRequest, Long> {
    List<MovingRequest> findByUserOrderByCreatedAtDesc(User user);
    List<MovingRequest> findAllByOrderByCreatedAtDesc();
    List<MovingRequest> findByStatusOrderByCreatedAtDesc(String status);
    List<MovingRequest> findByMoverOrderByCreatedAtDesc(User mover);
}
