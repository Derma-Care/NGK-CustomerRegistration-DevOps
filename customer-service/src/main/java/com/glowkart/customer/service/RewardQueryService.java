package com.glowkart.customer.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.glowkart.customer.dto.RewardTransactionDTO;
import com.glowkart.customer.dto.WalletSummaryDTO;
import com.glowkart.customer.enums.RewardTransactionType;
import com.glowkart.customer.exception.CustomerNotFoundException;
import com.glowkart.customer.model.Customer;
import com.glowkart.customer.model.RewardTransaction;
import com.glowkart.customer.repo.CustomerRepository;
import com.glowkart.customer.repo.RewardTransactionRepository;

@Service
public class RewardQueryService {

    @Autowired
    private RewardTransactionRepository rewardRepo;

    @Autowired
    private CustomerRepository customerRepo;

    /**
     * Get wallet summary for a customer by mobile number
     */
    public WalletSummaryDTO getWalletSummary(String mobile) {

        Customer customer = customerRepo.findByMobile(mobile)
                .orElseThrow(() -> new CustomerNotFoundException(
                        "Customer not found with mobile: " + mobile
                ));

        int totalCredits = customer.getRewardPoints();

        int totalDebits = rewardRepo.findByMobileAndType(
                mobile, RewardTransactionType.DEBIT)
                .stream()
                .mapToInt(RewardTransaction::getPoints)
                .sum();

        int balance = totalCredits - totalDebits;

        String membership = determineMembership(totalCredits);
        int coinValue = coinValueFor(membership);

        return WalletSummaryDTO.builder()
                .totalCredits(totalCredits)
                .totalDebits(totalDebits)
                .balance(balance)
                .membership(membership)
                .coinValue(coinValue)
                .balanceValue(balance * coinValue)
                .levels(Map.of(
                        "BASIC", 0,
                        "SILVER", 2500,
                        "GOLD", 5000,
                        "PLATINUM", 7500
                ))
                .build();
    }


    private String determineMembership(int totalCredits) {
        if (totalCredits >= 7500) return "PLATINUM";
        if (totalCredits >= 5000) return "GOLD";
        if (totalCredits >= 2500) return "SILVER";
        return "BASIC";
    }

    private int coinValueFor(String membership) {
        switch (membership) {
            case "PLATINUM": return 4;
            case "GOLD": return 3;
            case "SILVER": return 2;
            default: return 1;
        }
    }

    /**
     * Get reward transactions with optional filter
     */
    public List<RewardTransactionDTO> getTransactions(String mobile, String filter) {

        // Validate customer
        customerRepo.findByMobile(mobile)
                .orElseThrow(() -> new CustomerNotFoundException(
                        "Customer not found with mobile: " + mobile
                ));

        List<RewardTransaction> txs =
                rewardRepo.findByMobileOrderByCreatedAtDesc(mobile);

        String normalizedFilter =
                filter == null ? "all" : filter.trim().toLowerCase();

        if ("credit".equals(normalizedFilter)) {
            txs = txs.stream()
                    .filter(t -> t.getType() == RewardTransactionType.CREDIT)
                    .collect(Collectors.toList());
        } else if ("debit".equals(normalizedFilter)) {
            txs = txs.stream()
                    .filter(t -> t.getType() == RewardTransactionType.DEBIT)
                    .collect(Collectors.toList());
        }

        return txs.stream()
                .map(t -> new RewardTransactionDTO(
                        t.getId(),
                        t.getPoints(),
                        t.getType().name(),
                        t.getReason().name(),
                        t.getBalanceAfter(),
                        t.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

}
