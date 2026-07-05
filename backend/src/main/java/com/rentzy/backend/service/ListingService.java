package com.rentzy.backend.service;

import com.rentzy.backend.domain.Listing;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.ListingRepository;
import com.rentzy.backend.repository.UserRepository;
import com.rentzy.backend.repository.BuildingRepository;
import com.rentzy.backend.repository.SearchAlertRepository;
import com.rentzy.backend.domain.SearchAlert;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ListingService {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final BuildingRepository buildingRepository;
    private final LocationExpansionService locationExpansionService;
    private final SearchAlertRepository searchAlertRepository;
    private final NotificationService notificationService;

    @Cacheable(value = "listings")
    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }

    public Page<Listing> searchListings(String type, String location, Double minPrice, Double maxPrice, String configuration, String furnishing, String sortBy, int page, int size) {
        List<String> expandedLocations = locationExpansionService.getExpandedLocations(location);

        Specification<Listing> spec = (root, query, cb) -> {
            List<Predicate> predicates = new java.util.ArrayList<>();

            // Only show ACTIVE listings in public search (include null for legacy data)
            predicates.add(cb.or(
                cb.equal(root.get("status"), "ACTIVE"),
                cb.isNull(root.get("status"))
            ));

            if (type != null && !type.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("type")), type.toLowerCase()));
            }

            if (!expandedLocations.isEmpty()) {
                Predicate[] locPredicates = expandedLocations.stream()
                        .map(loc -> cb.or(
                            cb.like(cb.lower(root.get("location")), "%" + loc.toLowerCase() + "%"),
                            cb.like(cb.lower(root.join("owner", JoinType.LEFT).get("name")), "%" + loc.toLowerCase() + "%"),
                            cb.like(cb.lower(root.join("building", JoinType.LEFT).get("name")), "%" + loc.toLowerCase() + "%")
                        ))
                        .toArray(Predicate[]::new);
                predicates.add(cb.or(locPredicates));
            } else if (location != null && !location.trim().isEmpty()) {
                String searchStr = "%" + location.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("location")), searchStr),
                    cb.like(cb.lower(root.join("owner", JoinType.LEFT).get("name")), searchStr),
                    cb.like(cb.lower(root.join("building", JoinType.LEFT).get("name")), searchStr)
                ));
            }

            if (minPrice != null && minPrice > 0) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null && maxPrice > 0) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            if (configuration != null && !configuration.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("configuration"), configuration));
            }

            if (furnishing != null && !furnishing.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("furnishing"), furnishing));
            }

            if (sortBy != null) {
                if (sortBy.equals("price_asc")) {
                    query.orderBy(cb.asc(root.get("price")));
                } else if (sortBy.equals("price_desc")) {
                    query.orderBy(cb.desc(root.get("price")));
                }
            } else {
                query.orderBy(cb.desc(root.get("id"))); // Default sort
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page, size);
        return listingRepository.findAll(spec, pageable);
    }

    @Cacheable(value = "listingDetails", key = "#id")
    public Listing getListingById(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
    }

    public List<Listing> getListingsByBuildingId(Long buildingId) {
        return listingRepository.findByBuildingId(buildingId);
    }

    @Transactional
    @CacheEvict(value = {"listings", "listingDetails"}, allEntries = true)
    public Listing createListing(Listing listing, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        listing.setOwner(owner);
        if (listing.getBuilding() != null && listing.getBuilding().getId() != null) {
            listing.setBuilding(buildingRepository.findById(listing.getBuilding().getId()).orElse(null));
        }
        Listing savedListing = listingRepository.save(listing);
        
        // Trigger Search Alerts
        try {
            if (savedListing.getLocation() != null && savedListing.getType() != null) {
                // Find users who have alerts for this location and property type
                // Since location matching can be fuzzy, we will fetch alerts that match the property type
                // and then filter by location string matching
                List<SearchAlert> potentialAlerts = searchAlertRepository.findAll().stream()
                    .filter(a -> a.getPropertyType().equalsIgnoreCase(savedListing.getType()))
                    .filter(a -> savedListing.getLocation().toLowerCase().contains(a.getLocation().toLowerCase()))
                    .filter(a -> !a.getUser().getEmail().equals(ownerEmail)) // Don't notify the owner
                    .toList();
                
                for (SearchAlert alert : potentialAlerts) {
                    notificationService.createNotification(
                        alert.getUser().getEmail(),
                        "A new " + savedListing.getType() + " was just added in " + alert.getLocation() + "!",
                        "ALERT",
                        "/property/" + savedListing.getId()
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to trigger search alerts: " + e.getMessage());
        }

        return savedListing;
    }

    public List<Listing> getListingsByOwner(String ownerEmail) {
        return listingRepository.findByOwnerEmail(ownerEmail);
    }

    public List<Listing> getListingsByOwnerId(Long ownerId) {
        return listingRepository.findAll().stream()
                .filter(l -> l.getOwner().getId().equals(ownerId) && ("ACTIVE".equals(l.getStatus()) || l.getStatus() == null))
                .toList();
    }

    @Transactional
    @CacheEvict(value = {"listings", "listingDetails"}, allEntries = true)
    public void deleteListing(Long id, String ownerEmail) {
        Listing existing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        if (!existing.getOwner().getEmail().equals(ownerEmail)) {
            throw new RuntimeException("Not authorized to delete this listing");
        }
        listingRepository.deleteById(id);
    }

    @Transactional
    @CacheEvict(value = {"listings", "listingDetails"}, allEntries = true)
    public Listing updateListing(Long id, Listing updates, String ownerEmail) {
        Listing existing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        if (!existing.getOwner().getEmail().equals(ownerEmail)) {
            throw new RuntimeException("Not authorized to update this listing");
        }
        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getPrice() != null) existing.setPrice(updates.getPrice());
        if (updates.getLocation() != null) existing.setLocation(updates.getLocation());
        if (updates.getType() != null) existing.setType(updates.getType());
        if (updates.getConfiguration() != null) existing.setConfiguration(updates.getConfiguration());
        if (updates.getFurnishing() != null) existing.setFurnishing(updates.getFurnishing());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getAmenities() != null) existing.setAmenities(updates.getAmenities());
        if (updates.getImages() != null) existing.setImages(updates.getImages());
        if (updates.getVideoLink() != null) existing.setVideoLink(updates.getVideoLink());
        if (updates.getLatitude() != null) existing.setLatitude(updates.getLatitude());
        if (updates.getLongitude() != null) existing.setLongitude(updates.getLongitude());
        if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
        if (updates.getFacing() != null) existing.setFacing(updates.getFacing());
        if (updates.getAreaSqft() != null) existing.setAreaSqft(updates.getAreaSqft());
        
        // Mess Options
        if (updates.getMessAvailable() != null) existing.setMessAvailable(updates.getMessAvailable());
        if (updates.getMessType() != null) existing.setMessType(updates.getMessType());
        if (updates.getMessIncludedInRent() != null) existing.setMessIncludedInRent(updates.getMessIncludedInRent());
        if (updates.getMessPrice() != null) existing.setMessPrice(updates.getMessPrice());
        if (updates.getMealsProvided() != null) existing.setMealsProvided(updates.getMealsProvided());
        if (updates.getMessTimings() != null) existing.setMessTimings(updates.getMessTimings());
        if (updates.getCookingAllowed() != null) existing.setCookingAllowed(updates.getCookingAllowed());
        
        if (updates.getBuilding() != null && updates.getBuilding().getId() != null) {
            existing.setBuilding(buildingRepository.findById(updates.getBuilding().getId()).orElse(null));
        } else if (updates.getBuilding() == null) {
            existing.setBuilding(null); // Allow removing building assignment
        }

        return listingRepository.save(existing);
    }
}
