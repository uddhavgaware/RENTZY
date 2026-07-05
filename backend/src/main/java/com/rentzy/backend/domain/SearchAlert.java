package com.rentzy.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "search_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String location; // e.g. "Narhe", "Wakad"

    @Column(nullable = false)
    private String propertyType; // "Flat", "PG", "Roommate", etc.

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
