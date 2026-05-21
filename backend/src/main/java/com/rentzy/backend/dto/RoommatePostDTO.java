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
    private String propertyType;
    private Double latitude;
    private Double longitude;
    private Integer vacancies;
    private Integer totalCapacity;
    private List<String> preferences;
    private String gender;
    private String targetOccupation;
    private String targetGender;
    private Boolean maintenanceIncluded;
    private String availableFrom;
    private String agePreference;
    private String dietaryPref;
    private String smokingPref;
    private String drinkingPref;
    private String petsPref;
    private String sleepSchedule;
    private String cleanlinessLevel;
    private List<String> images;
    private RoommateUserDTO user;
    private String electricityBill;
    private String waterSupply;
    private String maintenance;
    private String facing;
    private Integer areaSqft;

    public static RoommatePostDTO fromEntity(RoommatePost post) {
        if (post == null) return null;
        
        RoommateUserDTO userDTO = null;
        if (post.getUser() != null) {
            userDTO = RoommateUserDTO.builder()
                .id(post.getUser().getId())
                .name(post.getUser().getName())
                .role(post.getUser().getRole() != null ? post.getUser().getRole().name() : null)
                .isVerified(post.getUser().getIsVerified())
                .gender(post.getUser().getGender())
                .email(Boolean.TRUE.equals(post.getUser().getContactShared()) ? post.getUser().getEmail() : null)
                .phone(Boolean.TRUE.equals(post.getUser().getContactShared()) ? post.getUser().getPhone() : null)
                .build();
        }

        return RoommatePostDTO.builder()
            .id(post.getId())
            .budget(post.getBudget())
            .deposit(post.getDeposit())
            .location(post.getLocation())
            .propertyType(post.getPropertyType())
            .latitude(post.getLatitude())
            .longitude(post.getLongitude())
            .vacancies(post.getVacancies())
            .totalCapacity(post.getTotalCapacity())
            .preferences(post.getPreferences())
            .gender(post.getGender())
            .targetOccupation(post.getTargetOccupation())
            .targetGender(post.getTargetGender())
            .maintenanceIncluded(post.getMaintenanceIncluded())
            .availableFrom(post.getAvailableFrom())
            .agePreference(post.getAgePreference())
            .dietaryPref(post.getDietaryPref())
            .smokingPref(post.getSmokingPref())
            .drinkingPref(post.getDrinkingPref())
            .petsPref(post.getPetsPref())
            .sleepSchedule(post.getSleepSchedule())
            .cleanlinessLevel(post.getCleanlinessLevel())
            .images(post.getImages())
            .user(userDTO)
            .electricityBill(post.getElectricityBill())
            .waterSupply(post.getWaterSupply())
            .maintenance(post.getMaintenance())
            .facing(post.getFacing())
            .areaSqft(post.getAreaSqft())
            .build();
    }
}
