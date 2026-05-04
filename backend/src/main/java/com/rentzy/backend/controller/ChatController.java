package com.rentzy.backend.controller;

import com.rentzy.backend.domain.Message;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.UserRepository;
import com.rentzy.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService service;
    private final UserRepository userRepository;

    @PostMapping("/send/{receiverId}")
    public ResponseEntity<Message> sendMessage(
            @PathVariable Long receiverId,
            @RequestBody String content,
            Authentication authentication
    ) {
        return ResponseEntity.ok(service.sendMessage(receiverId, content, authentication.getName()));
    }

    @GetMapping("/history/{otherUserId}")
    public ResponseEntity<List<Message>> getChatHistory(
            @PathVariable Long otherUserId,
            Authentication authentication
    ) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        return ResponseEntity.ok(service.getChatHistory(currentUser.getId(), otherUserId));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<User>> getConversations(Authentication authentication) {
        return ResponseEntity.ok(service.getConversations(authentication.getName()));
    }
}
