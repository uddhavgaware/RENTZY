package com.rentzy.backend.controller;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.rentzy.backend.domain.Booking;
import com.rentzy.backend.dto.OrderRequest;
import com.rentzy.backend.dto.PaymentVerifyRequest;
import com.rentzy.backend.repository.BookingRepository;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final RazorpayClient razorpayClient;
    private final BookingRepository bookingRepository;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    public PaymentController(RazorpayClient razorpayClient, BookingRepository bookingRepository) {
        this.razorpayClient = razorpayClient;
        this.bookingRepository = bookingRepository;
    }

    /**
     * Create a Razorpay order for a booking.
     * Frontend calls this after creating a booking to get the order ID for checkout.
     */
    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody OrderRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        try {
            // Amount in paise (INR smallest unit)
            int amountInPaise = (int) (booking.getAmount() * 3 * 100); // rent + security deposit

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "booking_" + booking.getId());
            orderRequest.put("notes", new JSONObject().put("bookingId", booking.getId()));

            Order order = razorpayClient.orders.create(orderRequest);

            // Save the razorpay order id on the booking
            booking.setRazorpayOrderId(order.get("id"));
            bookingRepository.save(booking);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("currency", order.get("currency"));
            response.put("keyId", razorpayKeyId);

            return ResponseEntity.ok(response);
        } catch (RazorpayException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create Razorpay order: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * Verify the Razorpay payment signature and confirm the booking.
     * Called by frontend after successful Razorpay checkout.
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestBody PaymentVerifyRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        try {
            // Verify the payment signature
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", request.getRazorpayOrderId());
            attributes.put("razorpay_payment_id", request.getRazorpayPaymentId());
            attributes.put("razorpay_signature", request.getRazorpaySignature());

            boolean isValid = Utils.verifyPaymentSignature(attributes, razorpayKeySecret);

            if (isValid) {
                booking.setStatus(Booking.BookingStatus.CONFIRMED);
                booking.setRazorpayPaymentId(request.getRazorpayPaymentId());
                bookingRepository.save(booking);

                Map<String, Object> response = new HashMap<>();
                response.put("status", "success");
                response.put("message", "Payment verified and booking confirmed");
                response.put("bookingId", booking.getId());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("status", "failure");
                response.put("message", "Payment verification failed — invalid signature");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (RazorpayException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "Verification error: " + e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
