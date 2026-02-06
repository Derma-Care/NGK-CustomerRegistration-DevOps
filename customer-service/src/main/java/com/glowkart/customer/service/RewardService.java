package com.glowkart.customer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.glowkart.customer.enums.RewardReason;
import com.glowkart.customer.enums.RewardTransactionType;
import com.glowkart.customer.model.Customer;
import com.glowkart.customer.model.RewardTransaction;
import com.glowkart.customer.repo.CustomerRepository;
import com.glowkart.customer.repo.RewardTransactionRepository;

import java.util.ArrayList;

@Service
public class RewardService {

    @Autowired
    private RewardTransactionRepository rewardRepo;

    @Autowired
    private CustomerRepository customerRepo;
    
    // ==================== Apply Registration Reward ====================
    @Transactional
    public RewardTransaction applyRegistrationReward(Customer customer) {
        // Check transaction history instead of boolean
        if (rewardRepo.existsByCustomerIdAndReason(customer.getCustomerId(), RewardReason.REGISTRATION_COMPLETED)) {
            return null; // already rewarded
        }

        int points = RewardReason.REGISTRATION_COMPLETED.getDefaultPoints();
        int updatedBalance = customer.getRewardPoints() + points;

        customer.setRewardPoints(updatedBalance);
        customerRepo.save(customer);

        RewardTransaction tx = new RewardTransaction();
        tx.setCustomerId(customer.getCustomerId());
        tx.setMobile(customer.getMobile());
        tx.setPoints(points);
        tx.setType(RewardTransactionType.CREDIT);
        tx.setReason(RewardReason.REGISTRATION_COMPLETED);
        tx.setBalanceAfter(updatedBalance);

        rewardRepo.save(tx);
        return tx;
    }
    
    // ==================== Deduct Points ====================
    @Transactional
    public RewardTransaction deductPoints(String customerId, int points) {

        if (points <= 0) {
            throw new IllegalArgumentException("Points to deduct must be positive");
        }

        Customer customer = customerRepo.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        // Balance is validated at booking-service level
        RewardTransaction tx = new RewardTransaction();
        tx.setCustomerId(customer.getCustomerId());
        tx.setMobile(customer.getMobile());
        tx.setPoints(points);
        tx.setType(RewardTransactionType.DEBIT);
        tx.setReason(RewardReason.REDEEMED_FOR_BOOKING);

        // balanceAfter is OPTIONAL / derived
        tx.setBalanceAfter(0); // or remove this column entirely

        rewardRepo.save(tx);
        return tx;
    }

    
    // ==================== Apply Referral Reward ====================
    @Transactional
    public RewardTransaction applyReferralReward(Customer referrer, Customer newCustomer) {
        if (referrer == null || newCustomer == null) return null;

        // Initialize referredCustomerIds if null
        if (referrer.getReferredCustomerIds() == null) {
            referrer.setReferredCustomerIds(new ArrayList<>());
        }

        // Avoid double reward for the same referral
        if (referrer.getReferredCustomerIds().contains(newCustomer.getCustomerId())) {
            return null;
        }

        int points = RewardReason.REFERRAL_BONUS.getDefaultPoints();
        int updatedBalance = referrer.getRewardPoints() + points;

        // Update referrer
        referrer.setRewardPoints(updatedBalance);
        referrer.getReferredCustomerIds().add(newCustomer.getCustomerId());
        customerRepo.save(referrer);

        // Save transaction
        RewardTransaction tx = new RewardTransaction();
        tx.setCustomerId(referrer.getCustomerId());
        tx.setMobile(referrer.getMobile());
        tx.setPoints(points);
        tx.setType(RewardTransactionType.CREDIT);
        tx.setReason(RewardReason.REFERRAL_BONUS);
        tx.setBalanceAfter(updatedBalance);
        tx.setRelatedCustomerId(newCustomer.getCustomerId());

        rewardRepo.save(tx);

        return tx;
    }

    /**
     * Credit points to a customer for booking completion
     */
    @Transactional
    public RewardTransaction creditBookingReward(
            String customerId,
            String bookingId,
            double bookingAmount) {

        // Idempotency
        if (rewardRepo.existsByBookingIdAndReason(
                bookingId, RewardReason.BOOKING_COMPLETED)) {
            return null;
        }

        Customer customer = customerRepo.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        // 🔑 TOTAL CREDITS BEFORE THIS BOOKING
        int totalCreditsBefore = customer.getRewardPoints();

        // Base points (₹100 = 1 point)
        int basePoints = (int) (bookingAmount / 100);

        // 🔥 MULTIPLIER BASED ON PREVIOUS TOTAL
        int earnedPoints;
        if (totalCreditsBefore >= 7500) {
            earnedPoints = basePoints * 4; // PLATINUM
        } else if (totalCreditsBefore >= 5000) {
            earnedPoints = basePoints * 3; // GOLD
        } else if (totalCreditsBefore >= 200) {
            earnedPoints = basePoints * 2; // SILVER
        } else {
            earnedPoints = basePoints;     // BASIC
        }

        int updatedBalance = totalCreditsBefore + earnedPoints;

        customer.setRewardPoints(updatedBalance);
        customerRepo.save(customer);

        RewardTransaction tx = new RewardTransaction();
        tx.setCustomerId(customerId);
        tx.setBookingId(bookingId);
        tx.setMobile(customer.getMobile());
        tx.setPoints(earnedPoints);
        tx.setType(RewardTransactionType.CREDIT);
        tx.setReason(RewardReason.BOOKING_COMPLETED);
        tx.setBalanceAfter(updatedBalance);

        rewardRepo.save(tx);

        return tx;
    }


    // ==================== POINT CALCULATION ====================
    private int calculateEarnedPoints(double bookingAmount) {
        // ₹100 = 1 point
        return (int) (bookingAmount / 100);
    }


}
