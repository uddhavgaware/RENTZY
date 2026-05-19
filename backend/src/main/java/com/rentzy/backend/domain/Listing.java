package com.rentzy.backend.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "listings")
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String type; // Hostel, Flat, Apartment, PG, Independent House, Villa, Co-living Space

    @Column
    private String configuration; // 1RK, 1BHK, 2BHK, 3BHK, 4BHK, Studio Apartment

    @Column
    private String furnishing; // Fully Furnished, Semi Furnished, Unfurnished

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> images;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> amenities;

    @Column
    private String videoLink;

    @Column
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, RENTED

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Review> reviews;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Booking> bookings;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<WishlistItem> wishlistItems;
}

