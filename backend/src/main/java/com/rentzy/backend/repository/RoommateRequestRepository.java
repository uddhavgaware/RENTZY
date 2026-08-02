package com.rentzy.backend.repository;

import com.rentzy.backend.domain.RoommatePost;
import com.rentzy.backend.domain.RoommateRequest;
import com.rentzy.backend.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoommateRequestRepository extends JpaRepository<RoommateRequest, Long> {
    List<RoommateRequest> findBySenderOrderByCreatedAtDesc(User sender);
    List<RoommateRequest> findByReceiverOrderByCreatedAtDesc(User receiver);
    List<RoommateRequest> findAllByOrderByCreatedAtDesc();
    boolean existsBySenderAndPostAndStatus(User sender, RoommatePost post, String status);
    Optional<RoommateRequest> findBySenderAndPost(User sender, RoommatePost post);

    @Modifying
    @Transactional
    void deleteByPost(RoommatePost post);
}
