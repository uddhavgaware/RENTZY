package com.rentzy.backend.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "owner_properties")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class OwnerProperty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String propertyType; // PG, HOSTEL, FLAT

    @Column(length = 1000)
    private String address;

    @Column
    private String city;

    @Column
    @Builder.Default
    private Integer totalRooms = 1;

    @Column
    @Builder.Default
    private Integer totalBeds = 1;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
