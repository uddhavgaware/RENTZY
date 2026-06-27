package com.rentzy.backend.controller;

import com.rentzy.backend.domain.*;
import com.rentzy.backend.service.SplitExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/split")
@RequiredArgsConstructor
public class SplitExpenseController {

    private final SplitExpenseService splitExpenseService;

    // ─── Groups ──────────────────────────────────────

    @GetMapping("/groups")
    public ResponseEntity<List<SplitGroup>> getMyGroups(Authentication auth) {
        return ResponseEntity.ok(splitExpenseService.getMyGroups(auth.getName()));
    }

    @PostMapping("/groups")
    public ResponseEntity<SplitGroup> createGroup(
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String name = body.get("name");
        String description = body.getOrDefault("description", "");
        return ResponseEntity.ok(splitExpenseService.createGroup(auth.getName(), name, description));
    }

    @DeleteMapping("/groups/{groupId}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long groupId, Authentication auth) {
        splitExpenseService.deleteGroup(groupId, auth.getName());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/groups/{groupId}")
    public ResponseEntity<SplitGroup> updateGroup(
            @PathVariable Long groupId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String name = body.get("name");
        String description = body.getOrDefault("description", "");
        return ResponseEntity.ok(splitExpenseService.updateGroup(groupId, auth.getName(), name, description));
    }

    @PostMapping("/groups/join/{inviteCode}")
    public ResponseEntity<SplitGroupMember> joinGroup(
            @PathVariable String inviteCode,
            Authentication auth) {
        return ResponseEntity.ok(splitExpenseService.joinGroup(inviteCode, auth.getName()));
    }

    // ─── Members ─────────────────────────────────────

    @GetMapping("/groups/{groupId}/members")
    public ResponseEntity<List<SplitGroupMember>> getMembers(
            @PathVariable Long groupId, Authentication auth) {
        return ResponseEntity.ok(splitExpenseService.getMembers(groupId, auth.getName()));
    }

    @PostMapping("/groups/{groupId}/members")
    public ResponseEntity<SplitGroupMember> addMember(
            @PathVariable Long groupId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        // Support adding by userId, email, or userCode
        if (body.containsKey("userId")) {
            Long userId = Long.parseLong(body.get("userId"));
            return ResponseEntity.ok(splitExpenseService.addMember(groupId, userId, auth.getName()));
        } else if (body.containsKey("email")) {
            return ResponseEntity.ok(splitExpenseService.addMemberByEmail(groupId, body.get("email"), auth.getName()));
        } else if (body.containsKey("userCode")) {
            return ResponseEntity.ok(splitExpenseService.addMemberByUserCode(groupId, body.get("userCode"), auth.getName()));
        }
        throw new RuntimeException("Provide userId, email, or userCode to add a member");
    }

    @DeleteMapping("/groups/{groupId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            Authentication auth) {
        splitExpenseService.removeMember(groupId, memberId, auth.getName());
        return ResponseEntity.ok().build();
    }

    // ─── Expenses ────────────────────────────────────

    @GetMapping("/groups/{groupId}/expenses")
    public ResponseEntity<List<SplitExpense>> getExpenses(
            @PathVariable Long groupId, Authentication auth) {
        return ResponseEntity.ok(splitExpenseService.getExpenses(groupId, auth.getName()));
    }

    @PostMapping("/groups/{groupId}/expenses")
    @SuppressWarnings("unchecked")
    public ResponseEntity<SplitExpense> addExpense(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        String description = (String) body.get("description");
        Double amount = Double.parseDouble(body.get("amount").toString());
        String category = (String) body.getOrDefault("category", "other");
        Long paidByUserId = Long.parseLong(body.get("paidByUserId").toString());
        String splitType = (String) body.getOrDefault("splitType", "equal");
        List<Map<String, Object>> splits = (List<Map<String, Object>>) body.get("splits");
        String note = (String) body.getOrDefault("note", "");
        String dateStr = (String) body.get("date");
        LocalDateTime date = dateStr != null ? LocalDateTime.parse(dateStr + "T00:00:00") : null;

        return ResponseEntity.ok(splitExpenseService.addExpense(
                groupId, auth.getName(), description, amount, category,
                paidByUserId, splitType, splits, note, date));
    }

    @PutMapping("/expenses/{expenseId}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<SplitExpense> updateExpense(
            @PathVariable Long expenseId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        String description = (String) body.get("description");
        Double amount = Double.parseDouble(body.get("amount").toString());
        String category = (String) body.getOrDefault("category", "other");
        Long paidByUserId = Long.parseLong(body.get("paidByUserId").toString());
        String splitType = (String) body.getOrDefault("splitType", "equal");
        List<Map<String, Object>> splits = (List<Map<String, Object>>) body.get("splits");
        String note = (String) body.getOrDefault("note", "");
        String dateStr = (String) body.get("date");
        LocalDateTime date = dateStr != null ? LocalDateTime.parse(dateStr + "T00:00:00") : null;

        return ResponseEntity.ok(splitExpenseService.updateExpense(
                expenseId, auth.getName(), description, amount, category,
                paidByUserId, splitType, splits, note, date));
    }

    @DeleteMapping("/expenses/{expenseId}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long expenseId, Authentication auth) {
        splitExpenseService.deleteExpense(expenseId, auth.getName());
        return ResponseEntity.ok().build();
    }

    // ─── Settlements ─────────────────────────────────

    @GetMapping("/groups/{groupId}/settlements")
    public ResponseEntity<List<SplitSettlement>> getSettlements(
            @PathVariable Long groupId, Authentication auth) {
        return ResponseEntity.ok(splitExpenseService.getSettlements(groupId, auth.getName()));
    }

    @PostMapping("/groups/{groupId}/settlements")
    public ResponseEntity<SplitSettlement> addSettlement(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        Long fromUserId = Long.parseLong(body.get("fromUserId").toString());
        Long toUserId = Long.parseLong(body.get("toUserId").toString());
        Double amount = Double.parseDouble(body.get("amount").toString());
        String paymentScreenshotUrl = body.containsKey("paymentScreenshotUrl") ? (String) body.get("paymentScreenshotUrl") : null;
        return ResponseEntity.ok(splitExpenseService.addSettlement(
                groupId, auth.getName(), fromUserId, toUserId, amount, paymentScreenshotUrl));
    }

    // ─── Balances & Stats ────────────────────────────

    @GetMapping("/groups/{groupId}/balances")
    public ResponseEntity<Map<String, Object>> getBalances(
            @PathVariable Long groupId, Authentication auth) {
        return ResponseEntity.ok(splitExpenseService.getGroupBalances(groupId, auth.getName()));
    }

    @GetMapping("/groups/{groupId}/stats/{userId}")
    public ResponseEntity<Map<String, Object>> getMemberStats(
            @PathVariable Long groupId,
            @PathVariable Long userId,
            Authentication auth) {
        return ResponseEntity.ok(splitExpenseService.getMemberStats(groupId, userId, auth.getName()));
    }
}
