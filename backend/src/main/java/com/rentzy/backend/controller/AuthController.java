package com.rentzy.backend.controller;

import com.rentzy.backend.dto.AuthenticationRequest;
import com.rentzy.backend.dto.AuthenticationResponse;
import com.rentzy.backend.dto.GoogleLoginRequest;
import com.rentzy.backend.dto.RegisterRequest;
import com.rentzy.backend.dto.SendOtpRequest;
import com.rentzy.backend.dto.VerifyOtpRequest;
import com.rentzy.backend.dto.ForgotPasswordRequest;
import com.rentzy.backend.dto.ResetPasswordRequest;
import com.rentzy.backend.dto.VerifyEmailOtpRequest;
import com.rentzy.backend.service.AuthService;
import com.rentzy.backend.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;
    private final OtpService otpService;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/verify-email-otp")
    public ResponseEntity<AuthenticationResponse> verifyEmailOtp(@RequestBody VerifyEmailOtpRequest request) {
        return ResponseEntity.ok(service.verifyEmailOtp(request.getEmail(), request.getOtp()));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthenticationResponse> googleLogin(@RequestBody GoogleLoginRequest request) {
        return ResponseEntity.ok(service.googleLogin(request.getTokenId()));
    }

    @PostMapping("/truecaller")
    public ResponseEntity<AuthenticationResponse> truecallerLogin(@RequestBody com.rentzy.backend.dto.TruecallerLoginRequest request) {
        return ResponseEntity.ok(service.truecallerLogin(request.getPayload(), request.getSignature(), request.getSignatureAlgorithm()));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<String> sendOtp(@RequestBody SendOtpRequest request) {
        otpService.sendOtp(request.getPhone());
        return ResponseEntity.ok("OTP sent successfully");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthenticationResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(otpService.verifyOtp(request.getPhone(), request.getOtp()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        service.forgotPassword(request.getEmail());
        return ResponseEntity.ok("Password reset email sent successfully");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        service.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok("Password has been reset successfully");
    }
}
