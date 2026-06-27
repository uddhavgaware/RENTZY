package com.rentzy.backend.service;

import com.rentzy.backend.domain.RoommatePost;
import com.rentzy.backend.domain.User;
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
        return com.rentzy.backend.dto.RoommatePostDTO.fromEntity(saved);
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


