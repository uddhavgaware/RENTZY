package com.rentzy.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RoommateUserDTO {
    private Long id;
    private String name;
    private String email;
    private String role;
    private Boolean isVerified;
    private String gender;
    private String phone;
}
