package com.rentzy.backend.dto;

import lombok.Data;

@Data
public class TruecallerOAuthRequest {
    private String authorizationCode;
    private String codeVerifier;
}
