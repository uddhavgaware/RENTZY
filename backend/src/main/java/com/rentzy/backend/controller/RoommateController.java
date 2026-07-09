package com.rentzy.backend.controller;

import com.rentzy.backend.domain.RoommatePost;
import com.rentzy.backend.dto.RoommatePostDTO;
import com.rentzy.backend.dto.RoommatePostRequest;
import com.rentzy.backend.dto.RoommateRequestDTO;
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
        Page<RoommatePostDTO> dtos = service.getAllPosts(location, page, size);
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/matches")
    public ResponseEntity<List<RoommatePostDTO>> getSmartMatches(Authentication authentication) {
        List<RoommatePostDTO> matches = service.getSmartMatches(authentication.getName());
        return ResponseEntity.ok(matches);
    }

    @PostMapping
    @CacheEvict(value = "roommates", allEntries = true)
    public ResponseEntity<RoommatePostDTO> createPost(@RequestBody RoommatePostRequest request, Authentication authentication) {
        RoommatePostDTO savedPost = service.createPost(request, authentication.getName());
        return ResponseEntity.ok(savedPost);
    }

    @DeleteMapping("/{id}")
    @CacheEvict(value = "roommates", allEntries = true)
    public ResponseEntity<Void> deletePost(@PathVariable Long id, Authentication authentication) {
        service.deletePost(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    @CacheEvict(value = "roommates", allEntries = true)
    public ResponseEntity<RoommatePostDTO> updatePostStatus(
            @PathVariable Long id,
            @RequestParam String status,
            Authentication authentication) {
        RoommatePostDTO updated = service.updatePostStatus(id, status, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/requests/{postId}")
    public ResponseEntity<RoommateRequestDTO> sendRequest(
            @PathVariable Long postId,
            Authentication authentication) {
        RoommateRequestDTO request = service.sendRequest(postId, authentication.getName());
        return ResponseEntity.ok(request);
    }

    @PutMapping("/requests/{requestId}/status")
    public ResponseEntity<RoommateRequestDTO> updateRequestStatus(
            @PathVariable Long requestId,
            @RequestParam String status,
            Authentication authentication) {
        RoommateRequestDTO request = service.updateRequestStatus(requestId, status, authentication.getName());
        return ResponseEntity.ok(request);
    }

    @GetMapping("/requests/sent")
    public ResponseEntity<List<RoommateRequestDTO>> getSentRequests(Authentication authentication) {
        List<RoommateRequestDTO> requests = service.getSentRequests(authentication.getName());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/requests/received")
    public ResponseEntity<List<RoommateRequestDTO>> getReceivedRequests(Authentication authentication) {
        List<RoommateRequestDTO> requests = service.getReceivedRequests(authentication.getName());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/requests/all")
    public ResponseEntity<List<RoommateRequestDTO>> getAllRequests() {
        // Assume security configuration ensures only admins can hit this endpoint or handle here
        List<RoommateRequestDTO> requests = service.getAllRequests();
        return ResponseEntity.ok(requests);
    }
}

