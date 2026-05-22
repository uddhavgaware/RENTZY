package com.rentzy.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping
    public ResponseEntity<String> checkHealth() {
        try {
            // Execute a simple query to keep the Neon Database awake!
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return ResponseEntity.ok("OK - Server and Database are Awake!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error connecting to Database: " + e.getMessage());
        }
    }
}
