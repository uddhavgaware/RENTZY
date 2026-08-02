package com.rentzy.javafx.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.rentzy.javafx.model.BuildingDTO;
import com.rentzy.javafx.model.ListingDTO;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

public class ApiService {

    private static final ApiService INSTANCE = new ApiService();
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    private String baseUrl = "http://localhost:8080/api"; // Default to local server

    private ApiService() {
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_2)
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    public static ApiService getInstance() {
        return INSTANCE;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        if (baseUrl != null && baseUrl.endsWith("/")) {
            this.baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        } else {
            this.baseUrl = baseUrl;
        }
    }

    public List<ListingDTO> getListings() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/listings"))
                    .GET()
                    .timeout(Duration.ofSeconds(5))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return objectMapper.readValue(response.body(), new TypeReference<List<ListingDTO>>() {});
            }
        } catch (Exception e) {
            System.err.println("⚠️ Could not reach backend at " + baseUrl + "/listings. Using fallback demo data.");
        }
        return getFallbackListings();
    }

    public List<BuildingDTO> getBuildings() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/buildings"))
                    .GET()
                    .timeout(Duration.ofSeconds(5))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return objectMapper.readValue(response.body(), new TypeReference<List<BuildingDTO>>() {});
            }
        } catch (Exception e) {
            System.err.println("⚠️ Could not reach backend at " + baseUrl + "/buildings. Using fallback demo data.");
        }
        return getFallbackBuildings();
    }

    private List<ListingDTO> getFallbackListings() {
        List<ListingDTO> list = new ArrayList<>();
        list.add(new ListingDTO(1L, "Luxury Sky Villa with Panoramic View", 45000.0, "Koramangala 4th Block", "Bangalore", "FLAT", 3, "AVAILABLE"));
        list.add(new ListingDTO(2L, "Cozy Studio near Tech Park", 18500.0, "Hitec City Phase 2", "Hyderabad", "FLAT", 1, "AVAILABLE"));
        list.add(new ListingDTO(3L, "Premium PG with Meals & AC", 12000.0, "Viman Nagar", "Pune", "PG", 1, "AVAILABLE"));
        list.add(new ListingDTO(4L, "Spacious 2BHK Family Apartment", 28000.0, "Bandra West", "Mumbai", "FLAT", 2, "AVAILABLE"));
        list.add(new ListingDTO(5L, "Modern Office & Coworking Space", 75000.0, "Cyber City", "Gurgaon", "COMMERCIAL", 4, "AVAILABLE"));
        list.add(new ListingDTO(6L, "Garden Facing 3BHK Penthouse", 55000.0, "Indiranagar", "Bangalore", "FLAT", 3, "AVAILABLE"));
        return list;
    }

    private List<BuildingDTO> getFallbackBuildings() {
        List<BuildingDTO> list = new ArrayList<>();
        list.add(new BuildingDTO(101L, "Prestige Horizon Towers", "Outer Ring Road", "Bangalore", 120));
        list.add(new BuildingDTO(102L, "Lodha Excelus Heights", "Lower Parel", "Mumbai", 250));
        list.add(new BuildingDTO(103L, "DLF Cyber Terrace", "DLF Phase 3", "Gurgaon", 80));
        list.add(new BuildingDTO(104L, "Godrej Emerald Suites", "Gachibowli", "Hyderabad", 150));
        return list;
    }
}
