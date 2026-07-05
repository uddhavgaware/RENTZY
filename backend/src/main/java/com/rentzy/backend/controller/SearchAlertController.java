package com.rentzy.backend.controller;

import com.rentzy.backend.domain.SearchAlert;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.SearchAlertRepository;
import com.rentzy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class SearchAlertController {

    private final SearchAlertRepository searchAlertRepository;
    private final UserRepository userRepository;

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribeToAlert(@RequestBody Map<String, String> request, Authentication authentication) {
        String email = authentication.getName();
        String location = request.get("location");
        String propertyType = request.get("propertyType");

        if (location == null || propertyType == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Location and Property Type are required"));
        }

        if (searchAlertRepository.existsByUserEmailAndLocationIgnoreCaseAndPropertyTypeIgnoreCase(email, location, propertyType)) {
            return ResponseEntity.ok(Map.of("message", "Already subscribed to alerts for this location"));
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }

        SearchAlert alert = SearchAlert.builder()
                .user(userOptional.get())
                .location(location)
                .propertyType(propertyType)
                .build();
        
        searchAlertRepository.save(alert);
        return ResponseEntity.ok(Map.of("success", true, "message", "You will be notified when new " + propertyType + "s are added in " + location));
    }

    @GetMapping
    public ResponseEntity<List<SearchAlert>> getMyAlerts(Authentication authentication) {
        return ResponseEntity.ok(searchAlertRepository.findByUserEmail(authentication.getName()));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAlert(@PathVariable Long id, Authentication authentication) {
        searchAlertRepository.findById(id).ifPresent(alert -> {
            if (alert.getUser().getEmail().equals(authentication.getName())) {
                searchAlertRepository.delete(alert);
            }
        });
        return ResponseEntity.ok(Map.of("success", true));
    }
}
