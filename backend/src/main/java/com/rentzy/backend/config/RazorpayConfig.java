package com.rentzy.backend.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key.id:rzp_test_placeholder}")
    private String keyId;

    @Value("${razorpay.key.secret:placeholder}")
    private String keySecret;

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        try {
            return new RazorpayClient(keyId, keySecret);
        } catch (Exception e) {
            System.out.println("⚠️ Razorpay client initialization failed (likely placeholder keys). Payments will not work until valid keys are configured.");
            // Return a client with dummy keys so the app can still start
            // Payment endpoints will fail at runtime, which is acceptable for dev
            return new RazorpayClient("rzp_test_dummy", "dummy_secret");
        }
    }
}
