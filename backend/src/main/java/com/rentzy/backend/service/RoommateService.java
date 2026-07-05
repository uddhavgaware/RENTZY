package com.rentzy.backend.service;

import com.rentzy.backend.domain.RoommatePost;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.dto.RoommatePostDTO;
import com.rentzy.backend.dto.RoommatePostRequest;
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
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<RoommatePostDTO> getAllPosts(String location, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));
        if (location == null || location.trim().isEmpty()) {
            return repository.findAll(pageable).map(com.rentzy.backend.dto.RoommatePostDTO::fromEntity);
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

        return repository.findAll(spec, pageable).map(com.rentzy.backend.dto.RoommatePostDTO::fromEntity);
    }

    @Transactional
    public com.rentzy.backend.dto.RoommatePostDTO createPost(RoommatePostRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Build entity from DTO
        RoommatePost post = RoommatePost.builder()
                .user(user)
                .location(request.getLocation())
                .budget(request.getBudget())
                .deposit(request.getDeposit())
                .propertyType(request.getPropertyType())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .vacancies(request.getVacancies())
                .totalCapacity(request.getTotalCapacity())
                .preferences(request.getPreferences())
                .gender(request.getGender())
                .targetOccupation(request.getTargetOccupation())
                .targetGender(request.getTargetGender())
                .maintenanceIncluded(request.getMaintenanceIncluded())
                .availableFrom(request.getAvailableFrom())
                .agePreference(request.getAgePreference())
                .dietaryPref(request.getDietaryPref())
                .smokingPref(request.getSmokingPref())
                .drinkingPref(request.getDrinkingPref())
                .petsPref(request.getPetsPref())
                .sleepSchedule(request.getSleepSchedule())
                .cleanlinessLevel(request.getCleanlinessLevel())
                .images(request.getImages())
                .electricityBill(request.getElectricityBill())
                .waterSupply(request.getWaterSupply())
                .maintenance(request.getMaintenance())
                .facing(request.getFacing())
                .areaSqft(request.getAreaSqft())
                .build();
        
        // If user's profile gender is not set or empty, update it with post's gender
        if (post.getGender() != null && !post.getGender().trim().isEmpty() && 
            (user.getGender() == null || user.getGender().trim().isEmpty())) {
            user.setGender(post.getGender());
            userRepository.save(user);
        }
        
        // Upload base64 images to Cloudinary
        if (post.getImages() != null && !post.getImages().isEmpty()) {
            List<String> processedImages = post.getImages().stream().map(image -> {
                if (image != null && image.startsWith("data:image")) {
                    try {
                        return cloudinaryService.uploadBase64(image);
                    } catch (Exception e) {
                        System.err.println("Failed to upload roommate post image to Cloudinary: " + e.getMessage());
                        return null; // Drop failed uploads instead of storing huge base64
                    }
                }
                return image;
            }).filter(img -> img != null).collect(Collectors.toList());
            post.setImages(processedImages);
        }
        
        RoommatePost saved = repository.save(post);
        
        try {
            // Find users who have posted in the same location (fuzzy match)
            if (saved.getLocation() != null) {
                List<RoommatePost> similarPosts = repository.findAll().stream()
                    .filter(p -> p.getLocation() != null && p.getLocation().toLowerCase().contains(saved.getLocation().toLowerCase()))
                    .filter(p -> !p.getUser().getId().equals(user.getId())) // Not self
                    .toList();
                
                // Get unique users from those posts
                List<User> usersToNotify = similarPosts.stream().map(RoommatePost::getUser).distinct().toList();
                
                for (User u : usersToNotify) {
                    notificationService.createNotification(
                        u.getEmail(),
                        "Someone is looking for a roommate in " + saved.getLocation() + "! Check out their profile.",
                        "ROOMMATE_MATCH",
                        "/roommates"
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to send roommate notifications: " + e.getMessage());
        }
        
        return com.rentzy.backend.dto.RoommatePostDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<RoommatePostDTO> getSmartMatches(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<RoommatePost> allPosts = repository.findAll();
        List<RoommatePostDTO> matchedPosts = new ArrayList<>();
        
        for (RoommatePost post : allPosts) {
            // Don't match with own posts
            if (post.getUser().getId().equals(user.getId())) continue;
            
            int matchScore = 0;
            int totalCriteria = 0;
            
            // Score Dietary Preference
            if (user.getDietaryPref() != null && !user.getDietaryPref().isEmpty() && !"Any".equalsIgnoreCase(user.getDietaryPref())) {
                totalCriteria++;
                if (user.getDietaryPref().equalsIgnoreCase(post.getDietaryPref()) || "Any".equalsIgnoreCase(post.getDietaryPref())) {
                    matchScore += 20;
                }
            }
            
            // Score Smoking Preference
            if (user.getSmokingPref() != null && !user.getSmokingPref().isEmpty() && !"Any".equalsIgnoreCase(user.getSmokingPref())) {
                totalCriteria++;
                if (user.getSmokingPref().equalsIgnoreCase(post.getSmokingPref()) || "Any".equalsIgnoreCase(post.getSmokingPref())) {
                    matchScore += 20;
                }
            }
            
            // Score Drinking Preference
            if (user.getDrinkingPref() != null && !user.getDrinkingPref().isEmpty() && !"Any".equalsIgnoreCase(user.getDrinkingPref())) {
                totalCriteria++;
                if (user.getDrinkingPref().equalsIgnoreCase(post.getDrinkingPref()) || "Any".equalsIgnoreCase(post.getDrinkingPref())) {
                    matchScore += 20;
                }
            }
            
            // Score Sleep Schedule
            if (user.getSleepSchedule() != null && !user.getSleepSchedule().isEmpty() && !"Any".equalsIgnoreCase(user.getSleepSchedule())) {
                totalCriteria++;
                if (user.getSleepSchedule().equalsIgnoreCase(post.getSleepSchedule()) || "Any".equalsIgnoreCase(post.getSleepSchedule())) {
                    matchScore += 20;
                }
            }
            
            // Score Cleanliness Level
            if (user.getCleanlinessLevel() != null && !user.getCleanlinessLevel().isEmpty() && !"Any".equalsIgnoreCase(user.getCleanlinessLevel())) {
                totalCriteria++;
                if (user.getCleanlinessLevel().equalsIgnoreCase(post.getCleanlinessLevel()) || "Any".equalsIgnoreCase(post.getCleanlinessLevel())) {
                    matchScore += 20;
                }
            }
            
            // If user hasn't set any preferences, base score is 0
            int matchPercentage = 0;
            if (totalCriteria > 0) {
                // Normalize score to 100% based on how many criteria were actually evaluated
                matchPercentage = (matchScore * 100) / (totalCriteria * 20);
            }
            
            RoommatePostDTO dto = RoommatePostDTO.fromEntity(post);
            dto.setMatchPercentage(matchPercentage);
            matchedPosts.add(dto);
        }
        
        // Sort by match percentage descending, then by id descending
        matchedPosts.sort((p1, p2) -> {
            int cmp = Integer.compare(p2.getMatchPercentage(), p1.getMatchPercentage());
            if (cmp == 0) {
                return Long.compare(p2.getId(), p1.getId());
            }
            return cmp;
        });
        
        return matchedPosts;
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


