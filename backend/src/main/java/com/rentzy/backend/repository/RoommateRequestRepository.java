package com.rentzy.backend.repository;

import com.rentzy.backend.domain.RoommateRequest;
import com.rentzy.backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoommateRequestRepository extends JpaRepository<RoommateRequest, Long> {
    List<RoommateRequest> findBySenderOrderByCreatedAtDesc(User sender);
    List<RoommateRequest> findByReceiverOrderByCreatedAtDesc(User receiver);
    List<RoommateRequest> findAllByOrderByCreatedAtDesc();
    boolean existsBySenderAndPostAndStatus(User sender, com.rentzy.backend.domain.RoommatePost post, String status);
    Optional<RoommateRequest> findBySenderAndPost(User sender, com.rentzy.backend.domain.RoommatePost post);
}
