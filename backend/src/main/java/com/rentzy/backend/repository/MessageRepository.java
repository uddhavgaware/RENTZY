package com.rentzy.backend.repository;

import com.rentzy.backend.domain.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.rentzy.backend.domain.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessageRepository extends JpaRepository<Message, Long> {
    
    @Query("SELECT m FROM Message m WHERE (m.sender.id = :userId1 AND m.receiver.id = :userId2) OR (m.sender.id = :userId2 AND m.receiver.id = :userId1) ORDER BY m.timestamp ASC")
    List<Message> findChatHistory(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    @Query("SELECT DISTINCT u FROM User u WHERE u.id IN (SELECT m.receiver.id FROM Message m WHERE m.sender.id = :userId) OR u.id IN (SELECT m.sender.id FROM Message m WHERE m.receiver.id = :userId)")
    List<User> findConversations(@Param("userId") Long userId);
}
