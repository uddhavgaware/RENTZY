package com.rentzy.backend.dto;

import com.rentzy.backend.domain.RoommatePost;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class RoommatePostDTO {
    private Long id;
    private Double budget;
    private Double deposit;
    private String location;
    private Integer vacancies;
    private Integer totalCapacity;
    private List<String> preferences;
    private String targetOccupation;
    private String agePreference;
    private String smokingPref;
    private String drinkingPref;
    private String petsPref;
    private String sleepSchedule;
    private String cleanlinessLevel;
    private List<String> images;
    private RoommateUserDTO user;

    public static RoommatePostDTO fromEntity(RoommatePost post) {
        if (post == null) return null;
        
        RoommateUserDTO userDTO = null;
        if (post.getUser() != null) {
            userDTO = RoommateUserDTO.builder()
                .id(post.getUser().getId())
                .name(post.getUser().getName())
                .email(post.getUser().getEmail())
                .role(post.getUser().getRole() != null ? post.getUser().getRole().name() : null)
                .isVerified(post.getUser().getIsVerified())
                .build();
        }

        return RoommatePostDTO.builder()
            .id(post.getId())
            .budget(post.getBudget())
            .deposit(post.getDeposit())
            .location(post.getLocation())
            .vacancies(post.getVacancies())
            .totalCapacity(post.getTotalCapacity())
            .preferences(post.getPreferences())
            .targetOccupation(post.getTargetOccupation())
            .agePreference(post.getAgePreference())
            .smokingPref(post.getSmokingPref())
            .drinkingPref(post.getDrinkingPref())
            .petsPref(post.getPetsPref())
            .sleepSchedule(post.getSleepSchedule())
            .cleanlinessLevel(post.getCleanlinessLevel())
            .images(post.getImages())
            .user(userDTO)
            .build();
    }
}
