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

    private Integer vacancies;
    
    private Integer totalCapacity;

    @ElementCollection
    private List<String> preferences;

    // Demographic preferences
    private String targetOccupation; // Student, Professional, Any
    private String agePreference;

    // Lifestyle preferences
    private String smokingPref;
    private String drinkingPref;
    private String petsPref;
    private String sleepSchedule;
    private String cleanlinessLevel;

    @ElementCollection
    private List<String> images; // Optional photos
}
