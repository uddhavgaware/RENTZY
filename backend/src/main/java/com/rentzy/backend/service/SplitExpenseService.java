package com.rentzy.backend.service;

import com.rentzy.backend.domain.*;
import com.rentzy.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SplitExpenseService {

    private final SplitGroupRepository groupRepository;
    private final SplitGroupMemberRepository memberRepository;
    private final SplitExpenseRepository expenseRepository;
    private final SplitExpenseShareRepository shareRepository;
    private final SplitSettlementRepository settlementRepository;
    private final UserRepository userRepository;

    // ─── Groups ──────────────────────────────────────

    public List<SplitGroup> getMyGroups(String email) {
        User user = findUser(email);
        return groupRepository.findGroupsByUserId(user.getId());
    }

    @Transactional
    public SplitGroup createGroup(String email, String name, String description) {
        User user = findUser(email);
        SplitGroup group = SplitGroup.builder()
                .name(name)
                .description(description)
                .createdBy(user)
                .build();
        SplitGroup saved = groupRepository.save(group);

        // Auto-add creator as first member
        SplitGroupMember member = SplitGroupMember.builder()
                .group(saved)
                .user(user)
                .build();
        memberRepository.save(member);

        // Re-fetch to include member
        return groupRepository.findById(saved.getId()).orElse(saved);
    }

    @Transactional
    public SplitGroup updateGroup(Long groupId, String email, String name, String description) {
        SplitGroup group = findGroup(groupId);
        User user = findUser(email);
        if (!group.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Only the group creator can edit this group");
        }
        group.setName(name);
        group.setDescription(description);
        return groupRepository.save(group);
    }

    @Transactional
    public void deleteGroup(Long groupId, String email) {
        SplitGroup group = findGroup(groupId);
        User user = findUser(email);
        if (!group.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Only the group creator can delete this group");
        }
        groupRepository.delete(group);
    }

    // ─── Members ─────────────────────────────────────

    @Transactional
    public SplitGroupMember addMember(Long groupId, Long userId, String email) {
        assertMember(groupId, email);
        SplitGroup group = findGroup(groupId);
        User userToAdd = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new RuntimeException("User is already a member of this group");
        }

        SplitGroupMember member = SplitGroupMember.builder()
                .group(group)
                .user(userToAdd)
                .build();
        return memberRepository.save(member);
    }

    @Transactional
    public SplitGroupMember addMemberByEmail(Long groupId, String memberEmail, String requestorEmail) {
        assertMember(groupId, requestorEmail);
        SplitGroup group = findGroup(groupId);
        User userToAdd = userRepository.findByEmail(memberEmail)
                .orElseThrow(() -> new RuntimeException("No user found with email: " + memberEmail));

        if (memberRepository.existsByGroupIdAndUserId(groupId, userToAdd.getId())) {
            throw new RuntimeException("User is already a member of this group");
        }

        SplitGroupMember member = SplitGroupMember.builder()
                .group(group)
                .user(userToAdd)
                .build();
        return memberRepository.save(member);
    }

    @Transactional
    public SplitGroupMember addMemberByUserCode(Long groupId, String userCode, String requestorEmail) {
        assertMember(groupId, requestorEmail);
        SplitGroup group = findGroup(groupId);
        User userToAdd = userRepository.findByUserCode(userCode)
                .orElseThrow(() -> new RuntimeException("No user found with RentXY ID: " + userCode));

        if (memberRepository.existsByGroupIdAndUserId(groupId, userToAdd.getId())) {
            throw new RuntimeException("User is already a member of this group");
        }

        SplitGroupMember member = SplitGroupMember.builder()
                .group(group)
                .user(userToAdd)
                .build();
        return memberRepository.save(member);
    }

    @Transactional
    public SplitGroupMember joinGroup(String inviteCode, String requestorEmail) {
        User userToAdd = findUser(requestorEmail);
        SplitGroup group = groupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Invalid or expired invite code"));

        if (memberRepository.existsByGroupIdAndUserId(group.getId(), userToAdd.getId())) {
            throw new RuntimeException("You are already a member of this group");
        }

        SplitGroupMember member = SplitGroupMember.builder()
                .group(group)
                .user(userToAdd)
                .build();
        return memberRepository.save(member);
    }

    @Transactional
    public void removeMember(Long groupId, Long memberId, String email) {
        SplitGroup group = findGroup(groupId);
        User requestor = findUser(email);
        SplitGroupMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        if (!member.getGroup().getId().equals(groupId)) {
            throw new RuntimeException("Member does not belong to this group");
        }

        boolean isCreator = group.getCreatedBy().getId().equals(requestor.getId());
        boolean isSelf = member.getUser().getId().equals(requestor.getId());

        if (!isCreator && !isSelf) {
            throw new RuntimeException("Only the group creator can remove members");
        }

        memberRepository.delete(member);
    }

    public List<SplitGroupMember> getMembers(Long groupId, String email) {
        assertMember(groupId, email);
        return memberRepository.findByGroupId(groupId);
    }

    // ─── Expenses ────────────────────────────────────

    public List<SplitExpense> getExpenses(Long groupId, String email) {
        assertMember(groupId, email);
        return expenseRepository.findByGroupIdOrderByDateDesc(groupId);
    }

    @Transactional
    public SplitExpense addExpense(Long groupId, String email, String description, Double amount,
                                   String category, Long paidByUserId, String splitType,
                                   List<Map<String, Object>> splits, String note, LocalDateTime date) {
        assertMember(groupId, email);
        SplitGroup group = findGroup(groupId);
        User paidBy = userRepository.findById(paidByUserId)
                .orElseThrow(() -> new RuntimeException("Payer not found"));

        SplitExpense expense = SplitExpense.builder()
                .group(group)
                .groupId(groupId)
                .description(description)
                .amount(amount)
                .category(category)
                .paidBy(paidBy)
                .splitType(splitType)
                .note(note)
                .date(date != null ? date : LocalDateTime.now())
                .build();
        SplitExpense saved = expenseRepository.save(expense);

        // Save shares
        List<SplitExpenseShare> shareEntities = new ArrayList<>();
        for (Map<String, Object> s : splits) {
            Long userId = Long.parseLong(s.get("userId").toString());
            Double shareAmount = Double.parseDouble(s.get("amount").toString());
            Double pct = s.containsKey("percentage") && s.get("percentage") != null
                    ? Double.parseDouble(s.get("percentage").toString()) : null;

            User shareUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found for share"));

            SplitExpenseShare share = SplitExpenseShare.builder()
                    .expense(saved)
                    .user(shareUser)
                    .amount(shareAmount)
                    .percentage(pct)
                    .build();
            shareEntities.add(share);
        }
        shareRepository.saveAll(shareEntities);

        return expenseRepository.findById(saved.getId()).orElse(saved);
    }

    @Transactional
    public SplitExpense updateExpense(Long expenseId, String email, String description, Double amount,
                                      String category, Long paidByUserId, String splitType,
                                      List<Map<String, Object>> splits, String note, LocalDateTime date) {
        SplitExpense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        assertMember(expense.getGroupId(), email);

        User paidBy = userRepository.findById(paidByUserId)
                .orElseThrow(() -> new RuntimeException("Payer not found"));

        expense.setDescription(description);
        expense.setAmount(amount);
        expense.setCategory(category);
        expense.setPaidBy(paidBy);
        expense.setSplitType(splitType);
        expense.setNote(note);
        if (date != null) expense.setDate(date);

        // Delete old shares and add new ones
        shareRepository.deleteByExpenseId(expenseId);
        expense.getShares().clear();

        List<SplitExpenseShare> shareEntities = new ArrayList<>();
        for (Map<String, Object> s : splits) {
            Long userId = Long.parseLong(s.get("userId").toString());
            Double shareAmount = Double.parseDouble(s.get("amount").toString());
            Double pct = s.containsKey("percentage") && s.get("percentage") != null
                    ? Double.parseDouble(s.get("percentage").toString()) : null;

            User shareUser = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found for share"));

            SplitExpenseShare share = SplitExpenseShare.builder()
                    .expense(expense)
                    .user(shareUser)
                    .amount(shareAmount)
                    .percentage(pct)
                    .build();
            shareEntities.add(share);
        }
        shareRepository.saveAll(shareEntities);

        return expenseRepository.save(expense);
    }

    @Transactional
    public void deleteExpense(Long expenseId, String email) {
        SplitExpense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        assertMember(expense.getGroupId(), email);
        expenseRepository.delete(expense);
    }

    // ─── Settlements ─────────────────────────────────

    public List<SplitSettlement> getSettlements(Long groupId, String email) {
        assertMember(groupId, email);
        return settlementRepository.findByGroupIdOrderByDateDesc(groupId);
    }

    @Transactional
    public SplitSettlement addSettlement(Long groupId, String email, Long fromUserId, Long toUserId, Double amount) {
        assertMember(groupId, email);
        SplitGroup group = findGroup(groupId);
        User fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new RuntimeException("From user not found"));
        User toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new RuntimeException("To user not found"));

        SplitSettlement settlement = SplitSettlement.builder()
                .group(group)
                .groupId(groupId)
                .fromUser(fromUser)
                .toUser(toUser)
                .amount(amount)
                .build();
        return settlementRepository.save(settlement);
    }

    // ─── Balances & Stats ────────────────────────────

    public Map<String, Object> getGroupBalances(Long groupId, String email) {
        assertMember(groupId, email);
        List<SplitExpense> expenses = expenseRepository.findByGroupIdOrderByDateDesc(groupId);
        List<SplitSettlement> settlements = settlementRepository.findByGroupIdOrderByDateDesc(groupId);
        List<SplitGroupMember> members = memberRepository.findByGroupId(groupId);

        // Calculate net balances
        Map<Long, Double> net = new HashMap<>();
        members.forEach(m -> net.put(m.getUser().getId(), 0.0));

        for (SplitExpense exp : expenses) {
            Long payerId = exp.getPaidBy().getId();
            net.merge(payerId, exp.getAmount(), Double::sum);
            for (SplitExpenseShare share : exp.getShares()) {
                net.merge(share.getUser().getId(), -share.getAmount(), Double::sum);
            }
        }

        for (SplitSettlement s : settlements) {
            net.merge(s.getFromUser().getId(), s.getAmount(), Double::sum);
            net.merge(s.getToUser().getId(), -s.getAmount(), Double::sum);
        }

        // Calculate minimum transactions to settle
        List<Map<String, Object>> transactions = calculateMinTransactions(net);

        // Per-member balances
        List<Map<String, Object>> memberBalances = new ArrayList<>();
        for (SplitGroupMember m : members) {
            Map<String, Object> mb = new HashMap<>();
            mb.put("userId", m.getUser().getId());
            mb.put("name", m.getUser().getName());
            mb.put("profilePhoto", m.getUser().getProfilePhoto());
            mb.put("balance", net.getOrDefault(m.getUser().getId(), 0.0));
            memberBalances.add(mb);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("memberBalances", memberBalances);
        result.put("transactions", transactions);
        return result;
    }

    public Map<String, Object> getMemberStats(Long groupId, Long userId, String email) {
        assertMember(groupId, email);
        List<SplitExpense> allExpenses = expenseRepository.findByGroupIdOrderByDateDesc(groupId);
        List<SplitSettlement> settlements = settlementRepository.findByGroupIdOrderByDateDesc(groupId);

        double totalPaid = 0;
        double totalOwed = 0;
        Map<String, Double> categoryBreakdown = new HashMap<>();
        int expenseCount = 0;

        for (SplitExpense exp : allExpenses) {
            // Amount this member paid
            if (exp.getPaidBy().getId().equals(userId)) {
                totalPaid += exp.getAmount();
                expenseCount++;
            }
            // Amount this member owes in splits
            for (SplitExpenseShare share : exp.getShares()) {
                if (share.getUser().getId().equals(userId)) {
                    totalOwed += share.getAmount();
                    categoryBreakdown.merge(exp.getCategory(), share.getAmount(), Double::sum);
                }
            }
        }

        double settledPaid = 0;
        double settledReceived = 0;
        for (SplitSettlement s : settlements) {
            if (s.getFromUser().getId().equals(userId)) settledPaid += s.getAmount();
            if (s.getToUser().getId().equals(userId)) settledReceived += s.getAmount();
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("userId", userId);
        stats.put("totalPaid", totalPaid);
        stats.put("totalOwed", totalOwed);
        stats.put("netBalance", totalPaid - totalOwed + settledPaid - settledReceived);
        stats.put("expensesPaidCount", expenseCount);
        stats.put("categoryBreakdown", categoryBreakdown);
        stats.put("totalSettledPaid", settledPaid);
        stats.put("totalSettledReceived", settledReceived);
        return stats;
    }

    // ─── Helpers ─────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private SplitGroup findGroup(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found"));
    }

    private void assertMember(Long groupId, String email) {
        User user = findUser(email);
        if (!memberRepository.existsByGroupIdAndUserId(groupId, user.getId())) {
            throw new RuntimeException("You are not a member of this group");
        }
    }

    private List<Map<String, Object>> calculateMinTransactions(Map<Long, Double> net) {
        List<long[]> debtors = new ArrayList<>();  // [userId, amount * 100]
        List<long[]> creditors = new ArrayList<>();

        net.forEach((id, amt) -> {
            if (amt < -0.01) debtors.add(new long[]{id, Math.round(-amt * 100)});
            else if (amt > 0.01) creditors.add(new long[]{id, Math.round(amt * 100)});
        });

        debtors.sort((a, b) -> Long.compare(b[1], a[1]));
        creditors.sort((a, b) -> Long.compare(b[1], a[1]));

        List<Map<String, Object>> transactions = new ArrayList<>();
        int i = 0, j = 0;
        while (i < debtors.size() && j < creditors.size()) {
            long payment = Math.min(debtors.get(i)[1], creditors.get(j)[1]);
            if (payment > 0) {
                Map<String, Object> t = new HashMap<>();
                t.put("fromUserId", debtors.get(i)[0]);
                t.put("toUserId", creditors.get(j)[0]);
                t.put("amount", payment / 100.0);
                transactions.add(t);
            }
            debtors.get(i)[1] -= payment;
            creditors.get(j)[1] -= payment;
            if (debtors.get(i)[1] <= 0) i++;
            if (creditors.get(j)[1] <= 0) j++;
        }
        return transactions;
    }
}
