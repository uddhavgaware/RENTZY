package com.rentzy.backend.service;

import com.rentzy.backend.domain.Message;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.MessageRepository;
import com.rentzy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

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

        Message savedMessage = messageRepository.save(message);

        // Broadcast to receiver
        messagingTemplate.convertAndSend(
                "/user/" + receiver.getId() + "/queue/messages",
                savedMessage
        );
        
        // Also broadcast to sender for syncing across devices
        messagingTemplate.convertAndSend(
                "/user/" + sender.getId() + "/queue/messages",
                savedMessage
        );

        // Notify receiver
        notificationService.createNotification(
                receiver.getEmail(),
                "New message from " + sender.getName() + ": " + (content.length() > 30 ? content.substring(0, 30) + "..." : content),
                "SYSTEM",
                "/messages?user=" + sender.getId()
        );

        return savedMessage;
    }

    public List<Message> getChatHistory(Long userId1, Long userId2) {
        return messageRepository.findChatHistory(userId1, userId2);
    }

    public List<User> getConversations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return messageRepository.findConversations(user.getId());
    }

    public Message editMessage(Long messageId, String newContent, String userEmail) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        
        if (!message.getSender().getEmail().equals(userEmail)) {
            throw new RuntimeException("Only sender can edit message");
        }
        
        message.setContent(newContent);
        message.setIsEdited(true);
        Message savedMessage = messageRepository.save(message);
        
        messagingTemplate.convertAndSend("/user/" + message.getReceiver().getId() + "/queue/messages", savedMessage);
        messagingTemplate.convertAndSend("/user/" + message.getSender().getId() + "/queue/messages", savedMessage);
        
        return savedMessage;
    }

    public Message deleteMessage(Long messageId, String userEmail) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
                
        if (!message.getSender().getEmail().equals(userEmail)) {
            throw new RuntimeException("Only sender can delete message");
        }
        
        message.setIsDeleted(true);
        message.setContent("This message was deleted");
        Message savedMessage = messageRepository.save(message);
        
        messagingTemplate.convertAndSend("/user/" + message.getReceiver().getId() + "/queue/messages", savedMessage);
        messagingTemplate.convertAndSend("/user/" + message.getSender().getId() + "/queue/messages", savedMessage);
        
        return savedMessage;
    }

    public void markAsRead(Long messageId, String userEmail) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
                
        if (!message.getReceiver().getEmail().equals(userEmail)) {
            throw new RuntimeException("Only receiver can mark as read");
        }
        
        if (!message.getIsRead()) {
            message.setIsRead(true);
            Message savedMessage = messageRepository.save(message);
            
            messagingTemplate.convertAndSend("/user/" + message.getSender().getId() + "/queue/messages", savedMessage);
            messagingTemplate.convertAndSend("/user/" + message.getReceiver().getId() + "/queue/messages", savedMessage);
        }
    }
}
