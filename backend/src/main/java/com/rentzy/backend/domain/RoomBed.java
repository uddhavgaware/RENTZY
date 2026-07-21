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
@Table(name = "room_beds")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RoomBed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_property_id", nullable = false)
    private OwnerProperty ownerProperty;

    @Column(nullable = false)
    private String roomNumber; // e.g. "Flat 101" or "Room 202"

    @Column
    private String bedNumber; // e.g. "Bed A", "Bed B", "Full Flat"

    @Column
    private String sharingType; // Single, Double Sharing, Triple Sharing, Full Flat

    @Column(nullable = false)
    private Double monthlyRent;

    @Column
    @Builder.Default
    private Double electricityRatePerUnit = 10.0;

    @Column
    @Builder.Default
    private Double fixedMaintenance = 1000.0;

    @Column(nullable = false)
    @Builder.Default
    private String status = "VACANT"; // VACANT, OCCUPIED, MAINTENANCE

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_user_id")
    private User tenant;

    @Column
    private String tenantName;

    @Column
    private String tenantPhone;

    @Column
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
