package com.rentzy.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.Map;

@Service
public class AiService {

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    public Object generateContent(Map<String, Object> request) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            throw new RuntimeException("Gemini API Key is not configured on the server.");
        }

        String model = (String) request.get("model");
        Object payload = request.get("payload");

        if (model == null || payload == null) {
            throw new IllegalArgumentException("Model and payload are required");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + geminiApiKey;

        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Object> entity = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<Object> response = restTemplate.postForEntity(url, entity, Object.class);
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            // Forward the error so the frontend fallback logic can catch it
            throw new RuntimeException("Gemini API Error: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new RuntimeException("Failed to call Gemini API", e);
        }
    }
}
