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
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoommateService {

    private final RoommatePostRepository repository;
    private final UserRepository userRepository;
    private final LocationExpansionService locationExpansionService;
    private final CloudinaryService cloudinaryService;

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

    @Transactional
    public RoommatePost createPost(RoommatePost post, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        post.setUser(user);
        
        // If user's profile gender is not set or empty, update it with post's gender
        if (post.getGender() != null && !post.getGender().trim().isEmpty() && 
            (user.getGender() == null || user.getGender().trim().isEmpty())) {
            user.setGender(post.getGender());
            userRepository.save(user);
        }
        
        if (post.getImages() != null && !post.getImages().isEmpty()) {
            List<String> processedImages = post.getImages().stream().map(image -> {
                if (image != null && image.startsWith("data:image")) {
                    try {
                        return cloudinaryService.uploadBase64(image);
                    } catch (Exception e) {
                        System.err.println("Failed to upload roommate post image to Cloudinary: " + e.getMessage());
                        return image; // Fallback (might crash DB if too long, but better than silent drop)
                    }
                }
                return image;
            }).collect(Collectors.toList());
            post.setImages(processedImages);
        }
        
        return repository.save(post);
    }

    @Transactional
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

