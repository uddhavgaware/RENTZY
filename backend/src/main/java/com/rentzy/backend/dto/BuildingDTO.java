package com.rentzy.backend.dto;

import com.rentzy.backend.domain.Building;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BuildingDTO {
    private Long id;
    private String name;
    private String address;
    private String location;
    private String city;
    private Double latitude;
    private Double longitude;
    private String description;
    private String coverImage;
    private Integer totalUnits;
    private List<String> amenities;
    private String ownerName;
    private String ownerEmail;

    public static BuildingDTO fromEntity(Building building) {
        if (building == null) return null;
        return BuildingDTO.builder()
                .id(building.getId())
                .name(building.getName())
                .address(building.getAddress())
                .location(building.getLocation())
                .city(building.getCity())
                .latitude(building.getLatitude())
                .longitude(building.getLongitude())
                .description(building.getDescription())
                .coverImage(building.getCoverImage())
                .totalUnits(building.getTotalUnits())
                .amenities(building.getAmenities())
                .ownerName(building.getOwner() != null ? building.getOwner().getName() : null)
                .ownerEmail(building.getOwner() != null ? building.getOwner().getEmail() : null)
                .build();
    }
}
