package com.rentzy.backend.service;

import com.rentzy.backend.domain.Message;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.MessageRepository;
import com.rentzy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public Message sendMessage(Long receiverId, String content, String senderEmail) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .timestamp(LocalDateTime.now())
                .build();

        return messageRepository.save(message);
    }

    public List<Message> getChatHistory(Long userId1, Long userId2) {
        return messageRepository.findChatHistory(userId1, userId2);
    }

    public List<User> getConversations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return messageRepository.findConversations(user.getId());
    }
}
