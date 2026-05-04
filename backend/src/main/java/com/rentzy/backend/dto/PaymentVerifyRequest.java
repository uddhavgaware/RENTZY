package com.rentzy.backend.dto;

import lombok.Data;

@Data
public class PaymentVerifyRequest {
    private Long bookingId;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
}
