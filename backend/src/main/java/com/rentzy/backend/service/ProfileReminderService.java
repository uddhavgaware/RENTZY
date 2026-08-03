package com.rentzy.backend.service;

import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Automated profile completion reminder service.
 * Runs every 10 hours and emails Google-login users who haven't completed their profile.
 */
@Service
@RequiredArgsConstructor
public class ProfileReminderService {

    private static final Logger log = LoggerFactory.getLogger(ProfileReminderService.class);

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${frontend.url:https://rentxy.in}")
    private String frontendUrl;

    /**
     * Runs every 10 hours (36,000,000 ms).
     * Finds users with incomplete profiles and sends them a reminder email.
     */
    @Scheduled(fixedDelay = 36_000_000)
    public void sendProfileCompletionReminders() {
        log.info("[ProfileReminder] Starting scheduled profile completion reminder job...");

        LocalDateTime cutoff = LocalDateTime.now().minusHours(10);
        List<User> usersToRemind = userRepository.findUsersNeedingProfileReminder(cutoff);

        if (usersToRemind.isEmpty()) {
            log.info("[ProfileReminder] No users need reminders right now.");
            return;
        }

        log.info("[ProfileReminder] Found {} users to remind.", usersToRemind.size());

        int successCount = 0;
        for (User user : usersToRemind) {
            try {
                sendReminderEmail(user);
                user.setLastReminderSentAt(LocalDateTime.now());
                userRepository.save(user);
                successCount++;
                log.info("[ProfileReminder] Sent reminder to: {}", user.getEmail());
            } catch (Exception e) {
                log.error("[ProfileReminder] Failed to send reminder to {}: {}", user.getEmail(), e.getMessage());
            }
        }

        log.info("[ProfileReminder] Job complete. Sent {}/{} reminders.", successCount, usersToRemind.size());
    }

    private void sendReminderEmail(User user) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(user.getEmail());
        helper.setSubject("🏠 Complete your RentXY profile — find your perfect roommate!");

        String firstName = user.getName() != null ? user.getName().split(" ")[0] : "there";
        String profileUrl = frontendUrl + "/profile";

        // Determine which steps are missing
        boolean missingPhone = user.getPhone() == null || user.getPhone().isBlank();
        boolean missingOccupation = user.getOccupation() == null || user.getOccupation().isBlank();
        boolean missingGender = user.getGender() == null || user.getGender().isBlank();
        boolean missingDob = user.getDob() == null || user.getDob().isBlank();

        StringBuilder stepsHtml = new StringBuilder();
        if (missingPhone) stepsHtml.append(stepRow("📱", "Add your phone number", "Lets roommates reach you directly"));
        if (missingOccupation) stepsHtml.append(stepRow("💼", "Set your occupation", "Student, professional, or business — let matches know who you are"));
        if (missingGender) stepsHtml.append(stepRow("👤", "Add your gender", "Required for gender-based room filters"));
        if (missingDob) stepsHtml.append(stepRow("🎂", "Add your date of birth", "Helps calculate your age group for better matches"));
        if (stepsHtml.length() == 0) stepsHtml.append(stepRow("✅", "Review your preferences", "Fine-tune lifestyle preferences for smarter roommate matching"));

        String html = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8"/>
              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
              <title>Complete your RentXY Profile</title>
            </head>
            <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f0f4ff;">
            
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">
                    
                    <!-- Header -->
                    <tr><td style="background:linear-gradient(135deg,#4f46e5 0%%,#7c3aed 100%%);border-radius:20px 20px 0 0;padding:40px 40px 30px;text-align:center;">
                      <div style="font-size:40px;margin-bottom:10px;">🏠</div>
                      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">RentXY</h1>
                      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Find your perfect home &amp; roommate</p>
                    </td></tr>
                    
                    <!-- Body -->
                    <tr><td style="background:#ffffff;padding:40px;">
                      
                      <h2 style="color:#1e1b4b;font-size:22px;margin:0 0 12px;font-weight:700;">
                        Hey %s! 👋 Your profile is almost ready.
                      </h2>
                      <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 24px;">
                        You signed in with Google — great choice! But your RentXY profile still has a few steps 
                        left. A complete profile means <strong>better roommate matches</strong>, 
                        <strong>faster bookings</strong>, and a <strong>more trusted presence</strong> on the platform.
                      </p>
                      
                      <!-- Steps to complete -->
                      <div style="background:#f8f7ff;border:1px solid #e0e7ff;border-radius:14px;padding:24px;margin-bottom:28px;">
                        <p style="color:#4f46e5;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">
                          📋 Steps to Complete
                        </p>
                        %s
                      </div>
                      
                      <!-- CTA Button -->
                      <div style="text-align:center;margin:32px 0;">
                        <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:50px;font-weight:700;font-size:16px;letter-spacing:0.3px;box-shadow:0 4px 20px rgba(79,70,229,0.35);">
                          ✅ Complete My Profile Now
                        </a>
                      </div>
                      
                      <!-- Security notice -->
                      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
                        <p style="color:#15803d;font-weight:700;font-size:14px;margin:0 0 6px;">🔒 100%% Safe &amp; Secure</p>
                        <p style="color:#166534;font-size:13px;margin:0;line-height:1.6;">
                          Your personal information is <strong>encrypted end-to-end</strong> and stored securely. 
                          RentXY <strong>never sells or shares</strong> your data with any third party. 
                          We are fully compliant with data privacy standards and your Google account 
                          credentials are never stored by us — only your name and email are used for login.
                        </p>
                      </div>
                      
                      <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
                        If you feel your profile is already complete or you'd prefer not to receive these 
                        reminders, simply visit your profile settings and mark it as complete. 
                        We only send these helpful nudges once every 10 hours.
                      </p>
                      
                    </td></tr>
                    
                    <!-- Footer -->
                    <tr><td style="background:#f8f7ff;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;border-top:1px solid #e0e7ff;">
                      <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">
                        © 2025 RentXY — Find your perfect home in India
                      </p>
                      <p style="color:#9ca3af;font-size:11px;margin:0;">
                        This email was sent to %s because you signed up for RentXY.<br/>
                        Powered by Spring Boot + Gmail SMTP | 🔐 Secure &amp; Encrypted
                      </p>
                    </td></tr>
                    
                  </table>
                </td></tr>
              </table>
            
            </body>
            </html>
            """.formatted(firstName, stepsHtml.toString(), profileUrl, user.getEmail());

        helper.setText(html, true);
        mailSender.send(message);
    }

    private String stepRow(String icon, String title, String subtitle) {
        return """
            <div style="display:flex;align-items:flex-start;margin-bottom:14px;">
              <span style="font-size:20px;margin-right:12px;flex-shrink:0;">%s</span>
              <div>
                <p style="color:#1e1b4b;font-weight:600;font-size:14px;margin:0 0 2px;">%s</p>
                <p style="color:#6b7280;font-size:12px;margin:0;">%s</p>
              </div>
            </div>
            """.formatted(icon, title, subtitle);
    }
}
