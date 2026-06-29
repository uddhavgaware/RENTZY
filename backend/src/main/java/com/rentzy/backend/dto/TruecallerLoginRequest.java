package com.rentzy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TruecallerLoginRequest {
    private String payload;
    private String signature;
    private String signatureAlgorithm;
}
