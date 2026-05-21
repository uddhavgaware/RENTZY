package com.rentzy.backend.service;

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
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(tokenId);
            if (idToken == null) {
                throw new RuntimeException("Invalid Google token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            User user = repository.findByEmail(email).orElseGet(() -> {
                // Auto-register new Google users
                User newUser = User.builder()
                        .name(name)
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
            throw new RuntimeException("Google authentication failed: " + e.getMessage(), e);
        }
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
