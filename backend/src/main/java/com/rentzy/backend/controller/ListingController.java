package com.rentzy.backend.controller;

import com.rentzy.backend.domain.Listing;
import com.rentzy.backend.service.ListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
public class ListingController {

    private final ListingService service;

    @GetMapping
    public ResponseEntity<List<Listing>> getAllListings(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String configuration,
            @RequestParam(required = false) String furnishing,
            @RequestParam(required = false) String sortBy
    ) {
        return ResponseEntity.ok(service.searchListings(type, location, minPrice, maxPrice, configuration, furnishing, sortBy));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Listing> getListingById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getListingById(id));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Listing>> getMyListings(Authentication authentication) {
        return ResponseEntity.ok(service.getListingsByOwner(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<Listing> createListing(@RequestBody Listing listing, Authentication authentication) {
        return ResponseEntity.ok(service.createListing(listing, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable Long id) {
        service.deleteListing(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Listing> updateListing(
            @PathVariable Long id,
            @RequestBody Listing listing,
            Authentication authentication) {
        return ResponseEntity.ok(service.updateListing(id, listing, authentication.getName()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Listing> updateListingStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body,
            Authentication authentication) {
        String newStatus = body.get("status");
        if (newStatus == null || (!newStatus.equals("ACTIVE") && !newStatus.equals("INACTIVE") && !newStatus.equals("RENTED"))) {
            throw new RuntimeException("Invalid status. Must be ACTIVE, INACTIVE, or RENTED.");
        }
        Listing listing = service.getListingById(id);
        if (!listing.getOwner().getEmail().equals(authentication.getName())) {
            throw new RuntimeException("Not authorized to update this listing");
        }
        listing.setStatus(newStatus);
        return ResponseEntity.ok(service.updateListing(id, listing, authentication.getName()));
    }
}
