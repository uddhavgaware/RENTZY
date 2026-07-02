package com.rentzy.backend.service;

import com.rentzy.backend.domain.Building;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.dto.BuildingDTO;
import com.rentzy.backend.repository.BuildingRepository;
import com.rentzy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BuildingService {
    private final BuildingRepository buildingRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<BuildingDTO> searchBuildings(String query) {
        if (query == null || query.trim().isEmpty()) {
            return buildingRepository.findAll().stream()
                    .map(BuildingDTO::fromEntity)
                    .collect(Collectors.toList());
        }
        return buildingRepository.findByNameContainingIgnoreCase(query).stream()
                .map(BuildingDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<BuildingDTO> getBuildingsByOwner(String email) {
        return buildingRepository.findByOwnerEmail(email).stream()
                .map(BuildingDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public BuildingDTO createBuilding(BuildingDTO dto, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        Building building = Building.builder()
                .name(dto.getName())
                .address(dto.getAddress())
                .location(dto.getLocation())
                .city(dto.getCity())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .description(dto.getDescription())
                .coverImage(dto.getCoverImage())
                .totalUnits(dto.getTotalUnits())
                .amenities(dto.getAmenities())
                .owner(owner)
                .build();

        Building saved = buildingRepository.save(building);
        return BuildingDTO.fromEntity(saved);
    }

    @Transactional
    public BuildingDTO updateBuilding(Long id, BuildingDTO dto, String ownerEmail) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Building not found"));

        if (!building.getOwner().getEmail().equals(ownerEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        building.setName(dto.getName());
        building.setAddress(dto.getAddress());
        building.setLocation(dto.getLocation());
        building.setCity(dto.getCity());
        building.setLatitude(dto.getLatitude());
        building.setLongitude(dto.getLongitude());
        building.setDescription(dto.getDescription());
        building.setCoverImage(dto.getCoverImage());
        building.setTotalUnits(dto.getTotalUnits());
        building.setAmenities(dto.getAmenities());

        Building updated = buildingRepository.save(building);
        return BuildingDTO.fromEntity(updated);
    }

    @Transactional
    public void deleteBuilding(Long id, String ownerEmail) {
        Building building = buildingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Building not found"));

        if (!building.getOwner().getEmail().equals(ownerEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        buildingRepository.delete(building);
    }
}
