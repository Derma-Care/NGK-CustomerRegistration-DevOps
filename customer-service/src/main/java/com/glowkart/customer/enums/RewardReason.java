package com.glowkart.customer.enums;

public enum RewardReason {
    REGISTRATION_COMPLETED(100),   // new customer reward
    REFERRAL_BONUS(200),           // referrer reward
    REDEEMED_FOR_BOOKING(0),       // used when points are deducted
    BOOKING_COMPLETED(1);          // points credited for completing a booking

    private final int defaultPoints;

    RewardReason(int defaultPoints) {
        this.defaultPoints = defaultPoints;
    }

    public int getDefaultPoints() {
        return defaultPoints;
    }
}
