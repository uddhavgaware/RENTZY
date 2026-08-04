package com.rentzy.backend.controller;

import com.rentzy.backend.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/generate")
    public ResponseEntity<?> generateContent(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(aiService.generateContent(request));
    }
}
