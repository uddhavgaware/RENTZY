package com.rentzy.backend.service;

import com.rentzy.backend.domain.RoommatePost;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.dto.RoommatePostDTO;
import com.rentzy.backend.dto.RoommatePostRequest;
import com.rentzy.backend.repository.RoommatePostRepository;
import com.rentzy.backend.repository.UserRepository;
import com.rentzy.backend.repository.RoommateRequestRepository;
import com.rentzy.backend.domain.RoommateRequest;
import com.rentzy.backend.dto.RoommateRequestDTO;
import com.rentzy.backend.dto.RoommateUserDTO;
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
    private final RoommateRequestRepository requestRepository;
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
            Predicate statusPredicate = cb.equal(root.get("status"), "ACTIVE");
            if (expandedLocations.isEmpty()) {
                Predicate locPredicate = cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase() + "%");
                return cb.and(statusPredicate, locPredicate);
            }
            Predicate[] locPredicates = expandedLocations.stream()
                    .map(loc -> cb.like(cb.lower(root.get("location")), "%" + loc.toLowerCase() + "%"))
                    .toArray(Predicate[]::new);
            Predicate locOr = cb.or(locPredicates);
            return cb.and(statusPredicate, locOr);
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
            // Don't match with own posts or non-active posts
            if (post.getUser().getId().equals(user.getId()) || !"ACTIVE".equals(post.getStatus())) continue;
            
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

    @Transactional
    public RoommatePostDTO updatePostStatus(Long postId, String status, String userEmail) {
        RoommatePost post = repository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("Not authorized to update this post");
        }
        post.setStatus(status);
        RoommatePost saved = repository.save(post);
        return RoommatePostDTO.fromEntity(saved);
    }

    @Transactional
    public RoommateRequestDTO sendRequest(Long postId, String userEmail) {
        User sender = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        RoommatePost post = repository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
                
        if (post.getUser().getId().equals(sender.getId())) {
            throw new RuntimeException("You cannot send a request to your own post");
        }
        
        if (requestRepository.findBySenderAndPost(sender, post).isPresent()) {
            throw new RuntimeException("You have already sent a request for this post");
        }
        
        RoommateRequest request = RoommateRequest.builder()
                .sender(sender)
                .receiver(post.getUser())
                .post(post)
                .status("PENDING")
                .build();
                
        RoommateRequest saved = requestRepository.save(request);
        
        notificationService.createNotification(
            post.getUser().getEmail(),
            sender.getName() + " sent you a roommate request!",
            "ROOMMATE_REQUEST",
            "/dashboard"
        );
        
        return toRequestDTO(saved);
    }

    @Transactional
    public RoommateRequestDTO updateRequestStatus(Long requestId, String status, String userEmail) {
        RoommateRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        boolean isReceiver = request.getReceiver().getId().equals(currentUser.getId());
        boolean isSender = request.getSender().getId().equals(currentUser.getId());
        
        if (!isReceiver && !isSender) {
            throw new RuntimeException("Not authorized to update this request");
        }
        
        // Receiver can accept or reject
        if (isReceiver && ("ACCEPTED".equals(status) || "REJECTED".equals(status))) {
            request.setStatus(status);
            if ("ACCEPTED".equals(status)) {
                notificationService.createNotification(
                    request.getSender().getEmail(),
                    currentUser.getName() + " accepted your roommate request!",
                    "REQUEST_ACCEPTED",
                    "/chat?user=" + currentUser.getId()
                );
            } else {
                notificationService.createNotification(
                    request.getSender().getEmail(),
                    currentUser.getName() + " rejected your roommate request.",
                    "REQUEST_REJECTED",
                    "/dashboard"
                );
            }
        } 
        // Sender can cancel
        else if (isSender && "CANCELLED".equals(status)) {
            request.setStatus(status);
        } else {
            throw new RuntimeException("Invalid status update operation");
        }
        
        RoommateRequest saved = requestRepository.save(request);
        return toRequestDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<RoommateRequestDTO> getSentRequests(String userEmail) {
        User sender = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return requestRepository.findBySenderOrderByCreatedAtDesc(sender)
                .stream().map(this::toRequestDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RoommateRequestDTO> getReceivedRequests(String userEmail) {
        User receiver = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return requestRepository.findByReceiverOrderByCreatedAtDesc(receiver)
                .stream().map(this::toRequestDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RoommateRequestDTO> getAllRequests() {
        return requestRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toRequestDTO).collect(Collectors.toList());
    }

    private RoommateRequestDTO toRequestDTO(RoommateRequest req) {
        RoommateUserDTO senderDto = RoommateUserDTO.builder()
            .id(req.getSender().getId())
            .name(req.getSender().getName())
            .email(req.getSender().getEmail())
            .phone(req.getSender().getPhone())
            .profilePhoto(req.getSender().getProfilePhoto())
            .role(req.getSender().getRole().name())
            .build();
            
        RoommateUserDTO receiverDto = RoommateUserDTO.builder()
            .id(req.getReceiver().getId())
            .name(req.getReceiver().getName())
            .email(req.getReceiver().getEmail())
            .phone(req.getReceiver().getPhone())
            .profilePhoto(req.getReceiver().getProfilePhoto())
            .role(req.getReceiver().getRole().name())
            .build();
            
        return RoommateRequestDTO.builder()
            .id(req.getId())
            .sender(senderDto)
            .receiver(receiverDto)
            .postId(req.getPost().getId())
            .postLocation(req.getPost().getLocation())
            .postPropertyType(req.getPost().getPropertyType())
            .status(req.getStatus())
            .createdAt(req.getCreatedAt())
            .updatedAt(req.getUpdatedAt())
            .build();
    }
}


