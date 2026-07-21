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

import com.rentzy.backend.domain.PropertyBill;
import com.rentzy.backend.repository.PropertyBillRepository;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final RazorpayClient razorpayClient;
    private final BookingRepository bookingRepository;
    private final PropertyBillRepository propertyBillRepository;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    public PaymentController(RazorpayClient razorpayClient, BookingRepository bookingRepository, PropertyBillRepository propertyBillRepository) {
        this.razorpayClient = razorpayClient;
        this.bookingRepository = bookingRepository;
        this.propertyBillRepository = propertyBillRepository;
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
            
            if (amountInPaise < 100) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "Amount must be at least 100 paise");
                return ResponseEntity.badRequest().body(error);
            }

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
            String errorMsg = e.getMessage().toLowerCase();
            if (errorMsg.contains("authentication") || errorMsg.contains("unauthorized") || errorMsg.contains("invalid api key")) {
                error.put("error", "Authentication with payment gateway failed: " + e.getMessage());
                return ResponseEntity.status(401).body(error);
            }
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
            if (request.getRazorpayOrderId() == null || request.getRazorpayPaymentId() == null || request.getRazorpaySignature() == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("status", "failure");
                response.put("message", "Missing required payment fields");
                return ResponseEntity.badRequest().body(response);
            }

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

    /**
     * Create Razorpay order for Property Rent/Utility Bill.
     */
    @PostMapping("/create-bill-order")
    public ResponseEntity<Map<String, Object>> createBillOrder(@RequestBody Map<String, Object> reqBody) {
        Long billId = Long.parseLong(reqBody.get("billId").toString());
        PropertyBill bill = propertyBillRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        try {
            int amountInPaise = (int) (bill.getTotalAmount() * 100);
            if (amountInPaise < 100) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount must be at least 100 paise"));
            }

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "bill_" + bill.getId());
            orderRequest.put("notes", new JSONObject().put("billId", bill.getId()));

            Order order = razorpayClient.orders.create(orderRequest);

            bill.setRazorpayOrderId(order.get("id"));
            propertyBillRepository.save(bill);

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("currency", order.get("currency"));
            response.put("keyId", razorpayKeyId);

            return ResponseEntity.ok(response);
        } catch (RazorpayException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to create Razorpay order: " + e.getMessage()));
        }
    }

    /**
     * Verify Razorpay payment signature for Property Bill and mark as PAID.
     */
    @PostMapping("/verify-bill")
    public ResponseEntity<Map<String, Object>> verifyBillPayment(@RequestBody Map<String, String> reqBody) {
        Long billId = Long.parseLong(reqBody.get("billId"));
        PropertyBill bill = propertyBillRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        try {
            String razorpayOrderId = reqBody.get("razorpayOrderId");
            String razorpayPaymentId = reqBody.get("razorpayPaymentId");
            String razorpaySignature = reqBody.get("razorpaySignature");

            if (razorpayOrderId == null || razorpayPaymentId == null || razorpaySignature == null) {
                return ResponseEntity.badRequest().body(Map.of("status", "failure", "message", "Missing payment verification parameters"));
            }

            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", razorpayOrderId);
            attributes.put("razorpay_payment_id", razorpayPaymentId);
            attributes.put("razorpay_signature", razorpaySignature);

            boolean isValid = Utils.verifyPaymentSignature(attributes, razorpayKeySecret);

            if (isValid) {
                bill.setStatus("PAID");
                bill.setRazorpayPaymentId(razorpayPaymentId);
                bill.setPaidAt(LocalDateTime.now());
                propertyBillRepository.save(bill);

                return ResponseEntity.ok(Map.of("status", "success", "message", "Payment verified and bill marked as PAID", "billId", bill.getId()));
            } else {
                return ResponseEntity.badRequest().body(Map.of("status", "failure", "message", "Invalid payment signature"));
            }
        } catch (RazorpayException e) {
            return ResponseEntity.internalServerError().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
