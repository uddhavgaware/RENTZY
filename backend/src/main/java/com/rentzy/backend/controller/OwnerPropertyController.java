package com.rentzy.backend.controller;

import com.rentzy.backend.domain.OwnerProperty;
import com.rentzy.backend.domain.PropertyBill;
import com.rentzy.backend.domain.RoomBed;
import com.rentzy.backend.domain.User;
import com.rentzy.backend.repository.OwnerPropertyRepository;
import com.rentzy.backend.repository.PropertyBillRepository;
import com.rentzy.backend.repository.RoomBedRepository;
import com.rentzy.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner/properties")
@RequiredArgsConstructor
public class OwnerPropertyController {

    private final OwnerPropertyRepository ownerPropertyRepository;
    private final RoomBedRepository roomBedRepository;
    private final PropertyBillRepository propertyBillRepository;
    private final UserRepository userRepository;

    // Create property
    @PostMapping
    public ResponseEntity<OwnerProperty> createProperty(@RequestBody Map<String, Object> body, Authentication auth) {
        User owner = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        OwnerProperty property = OwnerProperty.builder()
                .name((String) body.get("name"))
                .propertyType((String) body.getOrDefault("propertyType", "PG"))
                .address((String) body.get("address"))
                .city((String) body.get("city"))
                .totalRooms(body.get("totalRooms") != null ? Integer.parseInt(body.get("totalRooms").toString()) : 1)
                .totalBeds(body.get("totalBeds") != null ? Integer.parseInt(body.get("totalBeds").toString()) : 1)
                .owner(owner)
                .build();

        OwnerProperty saved = ownerPropertyRepository.save(property);

        // Auto-create initial room/bed units based on total rooms
        int roomsCount = saved.getTotalRooms() != null ? saved.getTotalRooms() : 1;
        int bedsPerRoom = Math.max(1, (saved.getTotalBeds() != null ? saved.getTotalBeds() : 1) / roomsCount);

        for (int i = 1; i <= roomsCount; i++) {
            String roomNum = "Room " + (100 + i);
            for (int b = 1; b <= bedsPerRoom; b++) {
                String bedNum = roomsCount == 1 && bedsPerRoom == 1 ? "Full Unit" : "Bed " + (char)('A' + b - 1);
                RoomBed bed = RoomBed.builder()
                        .ownerProperty(saved)
                        .roomNumber(roomNum)
                        .bedNumber(bedNum)
                        .sharingType(bedsPerRoom == 1 ? "Single" : bedsPerRoom == 2 ? "Double Sharing" : "Triple Sharing")
                        .monthlyRent(body.get("defaultRent") != null ? Double.parseDouble(body.get("defaultRent").toString()) : 8000.0)
                        .electricityRatePerUnit(body.get("electricityRate") != null ? Double.parseDouble(body.get("electricityRate").toString()) : 10.0)
                        .fixedMaintenance(body.get("fixedMaintenance") != null ? Double.parseDouble(body.get("fixedMaintenance").toString()) : 1000.0)
                        .status("VACANT")
                        .build();
                roomBedRepository.save(bed);
            }
        }

        return ResponseEntity.ok(saved);
    }

    // Get owner's properties with room/bed units
    @GetMapping("/my")
    public ResponseEntity<List<Map<String, Object>>> getMyProperties(Authentication auth) {
        User owner = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<OwnerProperty> properties = ownerPropertyRepository.findByOwnerOrderByCreatedAtDesc(owner);

        List<Map<String, Object>> result = properties.stream().map(prop -> {
            List<RoomBed> beds = roomBedRepository.findByOwnerPropertyOrderByIdAsc(prop);
            Map<String, Object> map = new HashMap<>();
            map.put("property", prop);
            map.put("roomsBeds", beds);
            return map;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // Add room/bed unit to property
    @PostMapping("/{propertyId}/rooms")
    public ResponseEntity<RoomBed> addRoomBed(@PathVariable Long propertyId, @RequestBody Map<String, Object> body, Authentication auth) {
        User owner = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        OwnerProperty prop = ownerPropertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!prop.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        RoomBed bed = RoomBed.builder()
                .ownerProperty(prop)
                .roomNumber((String) body.get("roomNumber"))
                .bedNumber((String) body.getOrDefault("bedNumber", "Bed A"))
                .sharingType((String) body.getOrDefault("sharingType", "Single"))
                .monthlyRent(Double.parseDouble(body.get("monthlyRent").toString()))
                .electricityRatePerUnit(body.get("electricityRate") != null ? Double.parseDouble(body.get("electricityRate").toString()) : 10.0)
                .fixedMaintenance(body.get("fixedMaintenance") != null ? Double.parseDouble(body.get("fixedMaintenance").toString()) : 1000.0)
                .status("VACANT")
                .build();

        return ResponseEntity.ok(roomBedRepository.save(bed));
    }

    // Assign / update tenant to room/bed
    @PutMapping("/rooms/{roomId}/tenant")
    public ResponseEntity<RoomBed> updateRoomTenant(@PathVariable Long roomId, @RequestBody Map<String, String> body, Authentication auth) {
        User owner = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        RoomBed roomBed = roomBedRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room unit not found"));

        if (!roomBed.getOwnerProperty().getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        String tenantEmail = body.get("tenantEmail");
        String tenantName = body.get("tenantName");
        String tenantPhone = body.get("tenantPhone");
        String status = body.getOrDefault("status", "OCCUPIED");

        if (tenantEmail != null && !tenantEmail.trim().isEmpty()) {
            User tenant = userRepository.findByEmail(tenantEmail.trim()).orElse(null);
            roomBed.setTenant(tenant);
        }

        roomBed.setTenantName(tenantName);
        roomBed.setTenantPhone(tenantPhone);
        roomBed.setStatus(status);

        if ("VACANT".equalsIgnoreCase(status)) {
            roomBed.setTenant(null);
            roomBed.setTenantName(null);
            roomBed.setTenantPhone(null);
        }

        return ResponseEntity.ok(roomBedRepository.save(roomBed));
    }

    // Delete property
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProperty(@PathVariable Long id, Authentication auth) {
        User owner = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        OwnerProperty prop = ownerPropertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!prop.getOwner().getId().equals(owner.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        ownerPropertyRepository.delete(prop);
        return ResponseEntity.noContent().build();
    }

    // Owner Dashboard Summary Stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOwnerStats(Authentication auth) {
        User owner = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<OwnerProperty> properties = ownerPropertyRepository.findByOwnerOrderByCreatedAtDesc(owner);
        List<RoomBed> allBeds = roomBedRepository.findByOwnerPropertyOwnerOrderByIdAsc(owner);
        List<PropertyBill> allBills = propertyBillRepository.findByOwnerOrderByCreatedAtDesc(owner);

        long occupiedCount = allBeds.stream().filter(b -> "OCCUPIED".equalsIgnoreCase(b.getStatus())).count();
        long vacantCount = allBeds.stream().filter(b -> "VACANT".equalsIgnoreCase(b.getStatus())).count();

        double totalCollected = allBills.stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .mapToDouble(PropertyBill::getTotalAmount)
                .sum();

        double totalPending = allBills.stream()
                .filter(b -> "PENDING".equalsIgnoreCase(b.getStatus()) || "OVERDUE".equalsIgnoreCase(b.getStatus()))
                .mapToDouble(PropertyBill::getTotalAmount)
                .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProperties", properties.size());
        stats.put("totalBeds", allBeds.size());
        stats.put("occupiedBeds", occupiedCount);
        stats.put("vacantBeds", vacantCount);
        stats.put("totalCollected", totalCollected);
        stats.put("totalPending", totalPending);
        stats.put("totalBills", allBills.size());

        return ResponseEntity.ok(stats);
    }
}
