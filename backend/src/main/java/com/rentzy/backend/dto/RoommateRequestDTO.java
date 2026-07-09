package com.rentzy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoommateRequestDTO {
    private Long id;
    private RoommateUserDTO sender;
    private RoommateUserDTO receiver;
    private Long postId;
    private String postLocation;
    private String postPropertyType;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
