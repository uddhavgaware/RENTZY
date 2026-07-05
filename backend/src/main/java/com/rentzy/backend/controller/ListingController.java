package com.rentzy.backend.controller;

import com.rentzy.backend.domain.Listing;
import com.rentzy.backend.service.ListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import java.util.List;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService service;

    @GetMapping
    @Cacheable("listings")
    public ResponseEntity<Page<Listing>> getAllListings(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String configuration,
            @RequestParam(required = false) String furnishing,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.searchListings(type, location, minPrice, maxPrice, configuration, furnishing, sortBy, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Listing> getListingById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getListingById(id));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Listing>> getMyListings(Authentication authentication) {
        return ResponseEntity.ok(service.getListingsByOwner(authentication.getName()));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Listing>> getListingsByOwnerId(@PathVariable Long ownerId) {
        return ResponseEntity.ok(service.getListingsByOwnerId(ownerId));
    }

    @GetMapping("/building/{buildingId}")
    public ResponseEntity<List<Listing>> getListingsByBuildingId(@PathVariable Long buildingId) {
        return ResponseEntity.ok(service.getListingsByBuildingId(buildingId));
    }

    @PostMapping
    @CacheEvict(value = "listings", allEntries = true)
    public ResponseEntity<Listing> createListing(@RequestBody Listing listing, Authentication authentication) {
        return ResponseEntity.ok(service.createListing(listing, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @CacheEvict(value = "listings", allEntries = true)
    public ResponseEntity<Void> deleteListing(@PathVariable Long id, Authentication authentication) {
        service.deleteListing(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @CacheEvict(value = "listings", allEntries = true)
    public ResponseEntity<Listing> updateListing(
            @PathVariable Long id,
            @RequestBody Listing listing,
            Authentication authentication) {
        return ResponseEntity.ok(service.updateListing(id, listing, authentication.getName()));
    }

    @PatchMapping("/{id}/status")
    @CacheEvict(value = "listings", allEntries = true)
    public ResponseEntity<Listing> updateListingStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            Authentication authentication) {
        String newStatus = body.get("status");
        if (newStatus == null || (!newStatus.equals("ACTIVE") && !newStatus.equals("INACTIVE") && !newStatus.equals("RENTED"))) {
            throw new RuntimeException("Invalid status. Must be ACTIVE, INACTIVE, or RENTED.");
        }
        return ResponseEntity.ok(service.updateListingStatus(id, newStatus, authentication.getName()));
    }
}
