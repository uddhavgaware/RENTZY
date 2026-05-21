package com.rentzy.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "moving_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "mover_id", nullable = true)
    private User mover;

    @Column(nullable = false)
    private String fromLocation;

    @Column(nullable = false)
    private String toLocation;

    @Column(nullable = false)
    private String movingDate;

    @Column(nullable = false)
    private String propertySize; // e.g., 1BHK, 2BHK, Villa

    @Column
    private String movingTime;

    @Column
    private String additionalNotes;

    @Column
    private Double estimatedPrice;

    @Column
    @Builder.Default
    private String status = "PENDING"; // PENDING, QUOTED, ASSIGNED, COMPLETED, CANCELLED

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
