package com.rentzy.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class RoommatePostRequest {
    private String location;
    private Double budget;
    private Double deposit;
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
    private String electricityBill;
    private String waterSupply;
    private String maintenance;
    private String facing;
    private Integer areaSqft;
}
