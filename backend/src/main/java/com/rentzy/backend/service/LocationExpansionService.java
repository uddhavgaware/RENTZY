package com.rentzy.backend.service;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class LocationExpansionService {

    private final Map<String, List<String>> adjacencyMap = new HashMap<>();

    public LocationExpansionService() {
        // Pune specific clusters based on user request
        adjacencyMap.put("narhe", Arrays.asList("dhayari", "vadgaon budruk", "ambegaon bk", "ambegaon"));
        adjacencyMap.put("katraj", Arrays.asList("ambegaon", "dhankawadi", "bharti vidyapeeth", "sukhsagar nagar"));
        adjacencyMap.put("kothrud", Arrays.asList("karve nagar", "bavdhan", "paud road", "warje"));
        adjacencyMap.put("hinjewadi", Arrays.asList("wakad", "baner", "balewadi", "tathawade"));
        adjacencyMap.put("kharadi", Arrays.asList("viman nagar", "wadgaon sheri", "kalyani nagar", "wagholi"));
        adjacencyMap.put("viman nagar", Arrays.asList("kharadi", "kalyani nagar", "vishrantwadi", "lohegaon"));
        adjacencyMap.put("hadapsar", Arrays.asList("magarpatta", "amanora", "fursungi", "wanowrie"));
        adjacencyMap.put("wakad", Arrays.asList("hinjewadi", "tathawade", "pimple saudagar", "baner"));
        adjacencyMap.put("baner", Arrays.asList("balewadi", "wakad", "pashan", "aundh"));
        adjacencyMap.put("akurdi", Arrays.asList("nigdi", "chinchwad", "ravet", "pradhikaran", "pimpri"));
    }

    public List<String> getExpandedLocations(String query) {
        if (query == null || query.trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        String lowerQuery = query.toLowerCase().trim();
        List<String> locations = new ArrayList<>();
        locations.add(lowerQuery);
        
        // If the query is "pune", return all known Pune localities
        if (lowerQuery.equals("pune")) {
            adjacencyMap.keySet().forEach(locations::add);
            adjacencyMap.values().forEach(locations::addAll);
            return new ArrayList<>(new LinkedHashSet<>(locations));
        }
        
        // Find if query matches any key or values
        for (Map.Entry<String, List<String>> entry : adjacencyMap.entrySet()) {
            if (entry.getKey().contains(lowerQuery) || lowerQuery.contains(entry.getKey())) {
                locations.addAll(entry.getValue());
                // Add the key itself in case user typed "narhe pune"
                if (!locations.contains(entry.getKey())) {
                    locations.add(entry.getKey());
                }
            } else {
                for (String neighbor : entry.getValue()) {
                    if (neighbor.contains(lowerQuery) || lowerQuery.contains(neighbor)) {
                        locations.add(entry.getKey());
                        locations.addAll(entry.getValue());
                        break;
                    }
                }
            }
        }
        
        // Remove duplicates
        return new ArrayList<>(new LinkedHashSet<>(locations));
    }
}
