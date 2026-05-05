package com.rentzy.backend.service;

import com.rentzy.backend.domain.User;
import com.rentzy.backend.dto.AuthenticationResponse;
import com.rentzy.backend.repository.UserRepository;
import com.rentzy.backend.security.JwtService;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final UserRepository repository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    // Twilio Credentials (loaded from environment variables)
    @Value("${twilio.account.sid}")
    private String accountSid;

    @Value("${twilio.auth.token}")
    private String authToken;

    @Value("${twilio.messaging.service.sid}")
    private String messagingServiceSid;

    // In-memory store for OTPs (In production, use Redis with TTL)
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        try {
            if (accountSid != null && !accountSid.equals("placeholder")) {
                Twilio.init(accountSid, authToken);
                System.out.println("✅ Twilio initialized successfully.");
            } else {
                System.out.println("⚠️ Twilio credentials not configured. SMS OTP will not work.");
            }
        } catch (Exception e) {
            System.out.println("⚠️ Twilio initialization failed: " + e.getMessage() + ". SMS OTP will not work.");
        }
    }

    public void sendOtp(String phone) {
        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        
        // Store OTP temporarily
        otpStorage.put(phone, otp);

        try {
            Message.creator(
                    new PhoneNumber(phone),
                    messagingServiceSid,
                    "Your RENTZY login code is: " + otp
            ).create();
            System.out.println("Twilio SMS sent successfully. OTP: " + otp);
        } catch (Exception e) {
            // Fallback for development/testing if Twilio is inactive
            System.out.println("Failed to send OTP via Twilio: " + e.getMessage());
            System.out.println("FALLBACK OTP for " + phone + " is: " + otp);
        }
    }

    public AuthenticationResponse verifyOtp(String phone, String otp) {
        String storedOtp = otpStorage.get(phone);
        
        // Allow master OTP for testing purposes
        if ("839174".equals(otp)) {
             // Bypass
        } else if (storedOtp == null || !storedOtp.equals(otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        // Clear OTP after successful use
        otpStorage.remove(phone);

        // Find user by generated email or phone, or create a new one
        String generatedEmail = phone + "@rentzy.local";
        User user = repository.findByEmail(generatedEmail).orElseGet(() -> 
            repository.findByPhone(phone).orElseGet(() -> {
                User newUser = User.builder()
                        .name("New User") // Placeholder name
                        .email(generatedEmail) // Placeholder email
                        .phone(phone)
                        .password(passwordEncoder.encode(UUID.randomUUID().toString())) // Secure random password
                        .role(User.Role.TENANT) // Default role
                        .profileCompleted(false)
                        .build();
                return repository.save(newUser);
            })
        );

        var extraClaims = new java.util.HashMap<String, Object>();
        extraClaims.put("role", user.getRole() != null ? user.getRole().name() : User.Role.TENANT.name());
        extraClaims.put("name", user.getName() != null ? user.getName() : "User");

        var jwtToken = jwtService.generateToken(extraClaims, user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .message("OTP Verification successful")
                .build();
    }
}
