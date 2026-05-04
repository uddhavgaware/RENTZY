package com.rentzy.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendPasswordResetEmail(String to, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("RENTZY - Password Reset Request");
            
            String htmlContent = "<h2>Password Reset Request</h2>"
                    + "<p>You have requested to reset your password.</p>"
                    + "<p>Click the link below to set a new password:</p>"
                    + "<a href=\"" + resetLink + "\">Reset Password</a>"
                    + "<br><br><p>If you did not request this, please ignore this email.</p>";
                    
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    public void sendEmailOtp(String to, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("RENTZY - Email Verification Code");
            
            String htmlContent = "<h2>Verify your Email Address</h2>"
                    + "<p>Thank you for registering with RENTZY.</p>"
                    + "<p>Your 6-digit verification code is:</p>"
                    + "<h1 style='color: #4f46e5; letter-spacing: 5px;'>" + otp + "</h1>"
                    + "<br><br><p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>";
                    
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    public void sendAdminActionEmail(String to, String action, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject("RENTZY - Account Notice: " + action);
            
            String actionVerb = action.equals("WARNING") ? "issued a warning" : 
                              action.equals("BLOCKED") ? "blocked" : "deleted";
                              
            String htmlContent = "<h2>Account Notice</h2>"
                    + "<p>This is an official notice from RENTZY administration.</p>"
                    + "<p>Your account has been <strong>" + actionVerb + "</strong> for the following reason:</p>"
                    + "<blockquote style='border-left: 4px solid #ef4444; padding-left: 10px; color: #555; font-style: italic;'>" + (reason != null && !reason.trim().isEmpty() ? reason : "Violation of platform policies.") + "</blockquote>"
                    + "<br><br><p>If you believe this is an error, please contact support.</p>";
                    
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send admin action email: " + e.getMessage());
        }
    }
}
