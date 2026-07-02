package com.rentzy.backend.controller;

import com.rentzy.backend.dto.BuildingDTO;
import com.rentzy.backend.service.BuildingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/buildings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class BuildingController {
    
    private final BuildingService buildingService;

    @GetMapping
    public ResponseEntity<List<BuildingDTO>> searchBuildings(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(buildingService.searchBuildings(query));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BuildingDTO>> getMyBuildings(Authentication authentication) {
        return ResponseEntity.ok(buildingService.getBuildingsByOwner(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<BuildingDTO> createBuilding(@RequestBody BuildingDTO dto, Authentication authentication) {
        return ResponseEntity.ok(buildingService.createBuilding(dto, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BuildingDTO> updateBuilding(@PathVariable Long id, @RequestBody BuildingDTO dto, Authentication authentication) {
        return ResponseEntity.ok(buildingService.updateBuilding(id, dto, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBuilding(@PathVariable Long id, Authentication authentication) {
        buildingService.deleteBuilding(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
