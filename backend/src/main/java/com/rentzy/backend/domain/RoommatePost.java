package com.rentzy.backend.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "roommate_posts")
public class RoommatePost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Double budget;

    private Double deposit;

    private String location;
    
    private String propertyType;
    
    private Double latitude;
    private Double longitude;

    private Integer vacancies;
    
    private Integer totalCapacity;

    @ElementCollection
    private List<String> preferences;

    // Demographic preferences
    private String gender; // Requester's gender: Male, Female, Other
    private String targetOccupation; // Student, Professional, Any
    private String targetGender; // Male, Female, Any
    private String agePreference;
    
    private Boolean maintenanceIncluded;
    private String availableFrom; // Immediately, Within 15 Days, Next Month

    // Lifestyle preferences
    private String dietaryPref; // Any, Vegetarian, Non-Vegetarian, Vegan
    private String smokingPref;
    private String drinkingPref;
    private String petsPref;
    private String sleepSchedule;
    private String cleanlinessLevel;

    @ElementCollection
    @CollectionTable(name = "roommate_post_photos", joinColumns = @JoinColumn(name = "roommate_post_id"))
    @Column(name = "image_url", columnDefinition = "TEXT")
    private List<String> images; // Optional photos

    private String electricityBill; // Included, Not Included
    private String waterSupply; // Included, Not Included
    private String maintenance; // Included, Not Included

    private String facing;
    private Integer areaSqft;
    
    @Column(nullable = false)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, FULFILLED, INACTIVE
}
