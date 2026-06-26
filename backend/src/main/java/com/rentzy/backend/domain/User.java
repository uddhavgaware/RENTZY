package com.rentzy.backend.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.security.SecureRandom;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 10-digit unique user code for searching/sharing (e.g. "4812937650")
    @Column(unique = true, length = 10)
    private String userCode;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column
    private String phone;

    @Column
    private String dob;

    @Column
    private String gender;

    @Column
    private String occupation;

    @Column(length = 1000)
    private String profilePhoto;

    @Column
    @Builder.Default
    private Boolean profileCompleted = true;

    @Column
    @Builder.Default
    private Boolean isBlocked = false;

    @Column
    @Builder.Default
    private Boolean isDeleted = false;

    @Column
    @Builder.Default
    private Boolean deleteRequested = false;

    @Column
    @Builder.Default
    private Boolean isEmailVerified = false;

    @Column
    @Builder.Default
    private Boolean isVerified = false;

    @Column(length = 1000)
    private String kycDocumentUrl;

    @Column
    private String kycDocumentType;

    @Column
    private String kycDocumentNumber;

    @Column
    @Builder.Default
    private String kycStatus = "NONE"; // NONE, PENDING, APPROVED, REJECTED

    @Column
    @Builder.Default
    private Boolean contactShared = false;

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Listing> listings;

    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Booking> bookings;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Review> reviews;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<RoommatePost> roommatePosts;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<WishlistItem> wishlistItems;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private PasswordResetToken passwordResetToken;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Notification> notifications;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<MovingRequest> movingRequests;

    @OneToMany(mappedBy = "mover")
    @JsonIgnore
    private List<MovingRequest> assignedMovingRequests;

    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Message> sentMessages;

    @OneToMany(mappedBy = "receiver", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Message> receivedMessages;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<PushSubscription> pushSubscriptions;

    // Student specific fields
    @Column
    private String educationLevel;
    
    @Column(length = 1000)
    private String collegeName;
    
    @Column(length = 1000)
    private String courseName;
    
    @Column
    private String currentYear;

    // Professional fields
    @Column(length = 1000)
    private String companyName;

    @Column(length = 1000)
    private String jobRole;

    // Business fields
    @Column(length = 2000)
    private String businessDescription;

    @Column
    private String serviceCity;

    @Column
    private String city;

    @Column
    private String upiId;

    @Column(length = 1000)
    private String upiQrUrl;

    @Column
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (userCode == null) {
            // Generate a 10-digit numeric code (1000000000 – 9999999999)
            SecureRandom rng = new SecureRandom();
            long code = 1000000000L + (long)(rng.nextDouble() * 9000000000L);
            userCode = String.valueOf(code);
        }
    }

    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    @JsonIgnore
    public String getUsername() {
        return email;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return (isBlocked == null || !isBlocked) && (isEmailVerified != null && isEmailVerified);
    }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isEnabled() {
        return isDeleted == null || !isDeleted;
    }

    public enum Role {
        TENANT,
        OWNER,
        ADMIN,
        MOVER
    }
}
