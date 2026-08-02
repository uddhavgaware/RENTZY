package com.rentzy.javafx.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class BuildingDTO {
    private Long id;
    private String name;
    private String address;
    private String location;
    private String city;
    private String description;
    private String coverImage;
    private Integer totalUnits;
    private List<String> amenities;

    public BuildingDTO() {}

    public BuildingDTO(Long id, String name, String location, String city, Integer totalUnits) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.city = city;
        this.totalUnits = totalUnits;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }

    public Integer getTotalUnits() { return totalUnits; }
    public void setTotalUnits(Integer totalUnits) { this.totalUnits = totalUnits; }

    public List<String> getAmenities() { return amenities; }
    public void setAmenities(List<String> amenities) { this.amenities = amenities; }

    @Override
    public String toString() {
        return name + " - " + city;
    }
}
