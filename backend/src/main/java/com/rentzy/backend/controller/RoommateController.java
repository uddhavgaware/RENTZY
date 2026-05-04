package com.rentzy.backend.controller;

import com.rentzy.backend.domain.RoommatePost;
import com.rentzy.backend.dto.RoommatePostDTO;
import com.rentzy.backend.service.RoommateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roommates")
@RequiredArgsConstructor
public class RoommateController {

    private final RoommateService service;

    @GetMapping
    public ResponseEntity<List<RoommatePostDTO>> getAllPosts(@RequestParam(required = false) String location) {
        List<RoommatePostDTO> dtos = service.getAllPosts(location).stream()
                .map(RoommatePostDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<RoommatePostDTO> createPost(@RequestBody RoommatePost post, Authentication authentication) {
        RoommatePost savedPost = service.createPost(post, authentication.getName());
        return ResponseEntity.ok(RoommatePostDTO.fromEntity(savedPost));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id, Authentication authentication) {
        service.deletePost(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}

