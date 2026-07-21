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
@Table(name = "property_bills")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PropertyBill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "room_bed_id", nullable = false)
    private RoomBed roomBed;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tenant_id")
    private User tenant;

    @Column
    private String tenantName;

    @Column
    private String tenantPhone;

    @Column(nullable = false)
    private String billingMonth; // e.g. "2026-07"

    @Column
    private String dueDate; // e.g. "2026-07-31"

    @Column(nullable = false)
    private Double baseRent;

    @Column
    @Builder.Default
    private Double prevElectricityReading = 0.0;

    @Column
    @Builder.Default
    private Double currElectricityReading = 0.0;

    @Column
    @Builder.Default
    private Double unitsConsumed = 0.0;

    @Column
    @Builder.Default
    private Double electricityRate = 10.0;

    @Column
    @Builder.Default
    private Double electricityAmount = 0.0;

    @Column
    @Builder.Default
    private Double maintenanceAmount = 0.0;

    @Column
    @Builder.Default
    private Double waterCharge = 0.0;

    @Column
    @Builder.Default
    private Double otherCharges = 0.0;

    @Column(nullable = false)
    private Double totalAmount;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING"; // PENDING, PAID, OVERDUE

    @Column
    private String razorpayOrderId;

    @Column
    private String razorpayPaymentId;

    @Column
    private LocalDateTime paidAt;

    @Column
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
