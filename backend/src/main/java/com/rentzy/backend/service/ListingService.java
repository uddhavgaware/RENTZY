package com.rentzy.backend.service;

import com.rentzy.backend.domain.Listing;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.ListingRepository;
import com.rentzy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ListingService {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final LocationExpansionService locationExpansionService;

    public List<Listing> getAllListings() {
        return listingRepository.findAll();
    }

    public List<Listing> searchListings(String type, String location, Double minPrice, Double maxPrice, String configuration, String furnishing, String sortBy) {
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
                        .map(loc -> cb.like(cb.lower(root.get("location")), "%" + loc.toLowerCase() + "%"))
                        .toArray(Predicate[]::new);
                predicates.add(cb.or(locPredicates));
            } else if (location != null && !location.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase() + "%"));
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

        return listingRepository.findAll(spec);
    }

    public Listing getListingById(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
    }

    public Listing createListing(Listing listing, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new RuntimeException("Owner not found"));
        listing.setOwner(owner);
        return listingRepository.save(listing);
    }

    public List<Listing> getListingsByOwner(String ownerEmail) {
        return listingRepository.findByOwnerEmail(ownerEmail);
    }

    public void deleteListing(Long id) {
        listingRepository.deleteById(id);
    }

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
        return listingRepository.save(existing);
    }
}
