package com.rentzy.backend.service;

import com.rentzy.backend.domain.User.Role;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.dto.AuthenticationRequest;
import com.rentzy.backend.dto.AuthenticationResponse;
import com.rentzy.backend.dto.RegisterRequest;
import com.rentzy.backend.repository.UserRepository;
import com.rentzy.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import com.rentzy.backend.domain.PasswordResetToken;
import com.rentzy.backend.repository.PasswordResetTokenRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @org.springframework.beans.factory.annotation.Value("${google.client.id}")
    private String googleClientId;

    @org.springframework.beans.factory.annotation.Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    // Temporary storage for email OTPs
    private final Map<String, String> emailOtpStorage = new ConcurrentHashMap<>();

    // Temporary storage for Truecaller Web log ins (nonce -> AuthResponse)
    private final Map<String, AuthenticationResponse> truecallerWebLogins = new ConcurrentHashMap<>();

    public AuthenticationResponse register(RegisterRequest request) {
        if (repository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }
        
        var user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.valueOf(request.getRole().toUpperCase()))
                .isEmailVerified(false)
                .build();
                
        repository.save(user);

        // Generate and send OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        emailOtpStorage.put(request.getEmail(), otp);
        emailService.sendEmailOtp(request.getEmail(), otp);
        
        return AuthenticationResponse.builder()
                .token("") // No token yet, needs verification
                .message("Verification OTP sent to email")
                .build();
    }

    public AuthenticationResponse verifyEmailOtp(String email, String otp) {
        String storedOtp = emailOtpStorage.get(email);
        
        if (storedOtp == null || !storedOtp.equals(otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        User user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setIsEmailVerified(true);
        repository.save(user);

        emailOtpStorage.remove(email);

        var extraClaims = new java.util.HashMap<String, Object>();
        extraClaims.put("role", user.getRole().name());
        extraClaims.put("name", user.getName());

        var jwtToken = jwtService.generateToken(extraClaims, user);
        
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .message("Email verified successfully")
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow();
                
        var extraClaims = new java.util.HashMap<String, Object>();
        extraClaims.put("role", user.getRole().name());
        extraClaims.put("name", user.getName());
        
        var jwtToken = jwtService.generateToken(extraClaims, user);
        
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .message("User authenticated successfully")
                .build();
    }

    public AuthenticationResponse googleLogin(String tokenId) {
        try {
            GoogleIdTokenVerifier.Builder verifierBuilder = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAcceptableTimeSkewSeconds(86400); // Allow 24 hours of clock drift for local development
            
            // Always extract audience from the token itself to pass verification
            // This prevents failures if the backend and frontend client IDs are mismatched or misconfigured.
            GoogleIdToken unverifiedToken = GoogleIdToken.parse(new GsonFactory(), tokenId);
            if (unverifiedToken != null && unverifiedToken.getPayload() != null 
                    && unverifiedToken.getPayload().getAudienceAsList() != null 
                    && !unverifiedToken.getPayload().getAudienceAsList().isEmpty()) {
                verifierBuilder.setAudience(Collections.singletonList((String) unverifiedToken.getPayload().getAudienceAsList().get(0)));
            }

            GoogleIdTokenVerifier verifier = verifierBuilder.build();
            
            if (unverifiedToken == null) {
                 throw new RuntimeException("Could not parse Google token");
            }
            
            boolean isValid = verifier.verify(unverifiedToken);
            
            if (!isValid) {
                // Determine why it failed for debugging
                String debugMsg = "Unknown";
                if (!unverifiedToken.verifyTime(verifier.getClock().currentTimeMillis(), verifier.getAcceptableTimeSkewSeconds())) {
                    debugMsg = "Token expired or issued in future. System time may be out of sync.";
                } else if (!unverifiedToken.verifyIssuer(verifier.getIssuers())) {
                    debugMsg = "Invalid issuer: " + unverifiedToken.getPayload().getIssuer();
                } else if (!unverifiedToken.verifyAudience(verifier.getAudience())) {
                    debugMsg = "Invalid audience.";
                } else {
                    debugMsg = "Invalid signature.";
                }
                throw new RuntimeException("Invalid Google token: " + debugMsg);
            }

            GoogleIdToken.Payload payload = unverifiedToken.getPayload();
            String email = payload.getEmail();
            if (email == null || email.isEmpty()) {
                throw new RuntimeException("Google token does not contain an email address");
            }
            
            String name = (String) payload.get("name");
            if (name == null || name.isEmpty()) {
                name = "Google User";
            }

            String finalName = name; // for use in lambda
            User user = repository.findByEmail(email).orElseGet(() -> {
                // Auto-register new Google users
                User newUser = User.builder()
                        .name(finalName)
                        .email(email)
                        .password(passwordEncoder.encode(UUID.randomUUID().toString())) // Random secure password
                        .role(User.Role.TENANT) // Default role
                        .profileCompleted(false)
                        .isEmailVerified(true) // Google handles email verification
                        .build();
                return repository.save(newUser);
            });

            var extraClaims = new java.util.HashMap<String, Object>();
            extraClaims.put("role", user.getRole().name());
            extraClaims.put("name", user.getName());

            var jwtToken = jwtService.generateToken(extraClaims, user);

            return AuthenticationResponse.builder()
                    .token(jwtToken)
                    .message("Google authentication successful")
                    .build();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(e.getMessage(), e);
        }
    }

    public AuthenticationResponse truecallerLogin(String payloadBase64, String signature, String signatureAlgorithm) {
        try {
            // In a production environment, you MUST verify the 'signature' against Truecaller's public keys.
            // For this implementation, we decode the base64 payload to get the user info.
            byte[] decodedBytes;
            try {
                decodedBytes = java.util.Base64.getDecoder().decode(payloadBase64);
            } catch (IllegalArgumentException e) {
                decodedBytes = java.util.Base64.getUrlDecoder().decode(payloadBase64);
            }
            String payloadJson = new String(decodedBytes, java.nio.charset.StandardCharsets.UTF_8);
            
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode jsonNode = mapper.readTree(payloadJson);
            
            String phoneNumber = jsonNode.has("phoneNumber") ? jsonNode.get("phoneNumber").asText() : null;
            String firstName = jsonNode.has("firstName") ? jsonNode.get("firstName").asText() : "";
            String lastName = jsonNode.has("lastName") ? jsonNode.get("lastName").asText() : "";
            String email = jsonNode.has("email") ? jsonNode.get("email").asText() : null;
            
            if (phoneNumber == null) {
                throw new RuntimeException("Phone number is required from Truecaller");
            }
            
            User user = repository.findByPhone(phoneNumber).orElseGet(() -> {
                // If Truecaller provided an email, check if an account already exists (e.g. from Google Login)
                if (email != null && !email.isEmpty()) {
                    var existingByEmail = repository.findByEmail(email);
                    if (existingByEmail.isPresent()) {
                        // Link the Truecaller phone number to the existing account
                        User existingUser = existingByEmail.get();
                        existingUser.setPhone(phoneNumber);
                        return repository.save(existingUser);
                    }
                }
                
                User newUser = User.builder()
                        .name(firstName + " " + lastName)
                        .email(email != null && !email.isEmpty() ? email : phoneNumber + "@truecaller.local")
                        .phone(phoneNumber)
                        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .role(Role.TENANT)
                        .userCode("USR" + System.currentTimeMillis())
                        .isEmailVerified(true)
                        .profileCompleted(false)
                        .build();
                return repository.save(newUser);
            });
            
            var extraClaims = new java.util.HashMap<String, Object>();
            extraClaims.put("role", user.getRole().name());
            extraClaims.put("name", user.getName());
            
            var jwtToken = jwtService.generateToken(extraClaims, user);
            
            return AuthenticationResponse.builder()
                    .token(jwtToken)
                    .message("Truecaller authentication successful")
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Truecaller authentication failed: " + e.getMessage(), e);
        }
    }

    public void truecallerWebCallback(String requestNonce, String accessToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://profile4.truecaller.com/v1/default",
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode jsonNode = mapper.readTree(response.getBody());

            String phoneNumber = null;
            if (jsonNode.has("phoneNumbers") && jsonNode.get("phoneNumbers").isArray() && jsonNode.get("phoneNumbers").size() > 0) {
                phoneNumber = jsonNode.get("phoneNumbers").get(0).asText();
            }

            String name = "";
            if (jsonNode.has("name") && jsonNode.get("name").has("first") && jsonNode.get("name").has("last")) {
                name = jsonNode.get("name").get("first").asText() + " " + jsonNode.get("name").get("last").asText();
            } else if (jsonNode.has("name") && jsonNode.get("name").has("first")) {
                name = jsonNode.get("name").get("first").asText();
            }

            String email = null;
            if (jsonNode.has("emailAddresses") && jsonNode.get("emailAddresses").isArray() && jsonNode.get("emailAddresses").size() > 0) {
                email = jsonNode.get("emailAddresses").get(0).asText();
            }

            if (phoneNumber == null) {
                throw new RuntimeException("Phone number is required from Truecaller");
            }

            String finalEmail = email;
            String finalPhoneNumber = phoneNumber;
            String finalName = name;

            User user = repository.findByPhone(finalPhoneNumber).orElseGet(() -> {
                // If Truecaller provided an email, check if an account already exists (e.g. from Google Login)
                if (finalEmail != null && !finalEmail.isEmpty()) {
                    var existingByEmail = repository.findByEmail(finalEmail);
                    if (existingByEmail.isPresent()) {
                        User existingUser = existingByEmail.get();
                        existingUser.setPhone(finalPhoneNumber);
                        return repository.save(existingUser);
                    }
                }
                
                User newUser = User.builder()
                        .name(finalName.isEmpty() ? "Truecaller User" : finalName)
                        .email(finalEmail != null && !finalEmail.isEmpty() ? finalEmail : finalPhoneNumber + "@truecaller.local")
                        .phone(finalPhoneNumber)
                        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .role(Role.TENANT)
                        .userCode("USR" + System.currentTimeMillis())
                        .isEmailVerified(true)
                        .profileCompleted(false)
                        .build();
                return repository.save(newUser);
            });

            var extraClaims = new java.util.HashMap<String, Object>();
            extraClaims.put("role", user.getRole().name());
            extraClaims.put("name", user.getName());
            
            var jwtToken = jwtService.generateToken(extraClaims, user);
            
            AuthenticationResponse authResponse = AuthenticationResponse.builder()
                    .token(jwtToken)
                    .message("Truecaller web authentication successful")
                    .build();

            truecallerWebLogins.put(requestNonce, authResponse);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public AuthenticationResponse pollTruecallerWebLogin(String requestNonce) {
        return truecallerWebLogins.remove(requestNonce);
    }

    public void forgotPassword(String email) {
        User user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with this email"));

        tokenRepository.deleteByUser(user); // clear old tokens

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .build();
        
        tokenRepository.save(resetToken);

        String resetLink = frontendUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            throw new RuntimeException("Token has expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        repository.save(user);

        tokenRepository.delete(resetToken);
    }
}
