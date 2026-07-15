package com.rentzy.backend.controller;

import com.rentzy.backend.domain.Listing;
import com.rentzy.backend.domain.MaintenanceTicket;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.ListingRepository;
import com.rentzy.backend.repository.MaintenanceTicketRepository;
import com.rentzy.backend.repository.UserRepository;
import com.rentzy.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceTicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final NotificationService notificationService;

    // Tenant raises a ticket
    @PostMapping
    public ResponseEntity<?> createTicket(@RequestBody Map<String, Object> body, Authentication auth) {
        User tenant = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Long listingId = Long.parseLong(body.get("listingId").toString());
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        MaintenanceTicket ticket = MaintenanceTicket.builder()
                .tenant(tenant)
                .listing(listing)
                .issueType((String) body.get("issueType"))
                .description((String) body.get("description"))
                .priority(body.containsKey("priority") ? (String) body.get("priority") : "MEDIUM")
                .status("OPEN")
                .build();

        MaintenanceTicket saved = ticketRepository.save(ticket);

        // Notify property owner
        notificationService.createNotification(
                listing.getOwner().getEmail(),
                "🔧 New maintenance request from " + tenant.getName() + " for \"" + listing.getTitle() + "\": " + ticket.getIssueType(),
                "SYSTEM"
        );

        return ResponseEntity.ok(saved);
    }

    // Tenant views their own tickets
    @GetMapping("/my")
    public ResponseEntity<List<MaintenanceTicket>> getMyTickets(Authentication auth) {
        User tenant = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ticketRepository.findByTenantOrderByCreatedAtDesc(tenant));
    }

    // Owner views tickets for their properties
    @GetMapping("/owner")
    public ResponseEntity<List<MaintenanceTicket>> getOwnerTickets(Authentication auth) {
        User owner = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ticketRepository.findByListingOwnerOrderByCreatedAtDesc(owner));
    }

    // Owner updates ticket status
    @PutMapping("/{id}/status")
    public ResponseEntity<MaintenanceTicket> updateTicketStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        User owner = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        MaintenanceTicket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (!ticket.getListing().getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        ticket.setStatus((String) body.get("status"));
        if (body.containsKey("ownerNote")) ticket.setOwnerNote((String) body.get("ownerNote"));

        MaintenanceTicket saved = ticketRepository.save(ticket);

        // Notify tenant
        notificationService.createNotification(
                ticket.getTenant().getEmail(),
                "📋 Your maintenance ticket (" + ticket.getIssueType() + ") status updated to: " + ticket.getStatus(),
                "SYSTEM"
        );

        return ResponseEntity.ok(saved);
    }
}
