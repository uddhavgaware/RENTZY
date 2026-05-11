package com.rentzy.backend.service;

import com.rentzy.backend.domain.RoommatePost;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.RoommatePostRepository;
import com.rentzy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class RoommateService {

    private final RoommatePostRepository repository;
    private final UserRepository userRepository;
    private final LocationExpansionService locationExpansionService;

    public Page<RoommatePost> getAllPosts(String location, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (location == null || location.trim().isEmpty()) {
            return repository.findAll(pageable);
        }

        List<String> expandedLocations = locationExpansionService.getExpandedLocations(location);

        Specification<RoommatePost> spec = (root, query, cb) -> {
            if (expandedLocations.isEmpty()) {
                return cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase() + "%");
            }
            Predicate[] locPredicates = expandedLocations.stream()
                    .map(loc -> cb.like(cb.lower(root.get("location")), "%" + loc.toLowerCase() + "%"))
                    .toArray(Predicate[]::new);
            return cb.or(locPredicates);
        };

        return repository.findAll(spec, pageable);
    }

    public RoommatePost createPost(RoommatePost post, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        post.setUser(user);
        return repository.save(post);
    }

    public void deletePost(Long id, String userEmail) {
        RoommatePost post = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        // Only allow the creator to delete their own post
        if (!post.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Not authorized to delete this post");
        }
        repository.deleteById(id);
    }
}

