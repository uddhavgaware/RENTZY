package com.rentzy.backend.controller;

import com.rentzy.backend.domain.RoommatePost;
import com.rentzy.backend.dto.RoommatePostDTO;
import com.rentzy.backend.dto.RoommatePostRequest;
import com.rentzy.backend.service.RoommateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import java.util.List;

@RestController
@RequestMapping("/api/roommates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class RoommateController {

    private final RoommateService service;

    @GetMapping
    @Cacheable("roommates")
    public ResponseEntity<Page<RoommatePostDTO>> getAllPosts(
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<RoommatePostDTO> dtos = service.getAllPosts(location, page, size)
                .map(RoommatePostDTO::fromEntity);
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    @CacheEvict(value = "roommates", allEntries = true)
    public ResponseEntity<RoommatePostDTO> createPost(@RequestBody RoommatePostRequest request, Authentication authentication) {
        RoommatePost savedPost = service.createPost(request, authentication.getName());
        return ResponseEntity.ok(RoommatePostDTO.fromEntity(savedPost));
    }

    @DeleteMapping("/{id}")
    @CacheEvict(value = "roommates", allEntries = true)
    public ResponseEntity<Void> deletePost(@PathVariable Long id, Authentication authentication) {
        service.deletePost(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}

