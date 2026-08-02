package com.rentzy.javafx.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ListingDTO {
    private Long id;
    private String title;
    private String description;
    private Double price;
    private String location;
    private String city;
    private String propertyType;
    private Integer bedrooms;
    private Integer bathrooms;
    private String imageUrl;
    private String status;

    public ListingDTO() {}

    public ListingDTO(Long id, String title, Double price, String location, String city, String propertyType, Integer bedrooms, String status) {
        this.id = id;
        this.title = title;
        this.price = price;
        this.location = location;
        this.city = city;
        this.propertyType = propertyType;
        this.bedrooms = bedrooms;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPropertyType() { return propertyType; }
    public void setPropertyType(String propertyType) { this.propertyType = propertyType; }

    public Integer getBedrooms() { return bedrooms; }
    public void setBedrooms(Integer bedrooms) { this.bedrooms = bedrooms; }

    public Integer getBathrooms() { return bathrooms; }
    public void setBathrooms(Integer bathrooms) { this.bathrooms = bathrooms; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @Override
    public String toString() {
        return title + " (" + city + ") - ₹" + price;
    }
}
