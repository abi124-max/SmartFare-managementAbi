package com.smartfare.controller;

import com.smartfare.model.Booking;
import com.smartfare.service.BookingService;
import com.smartfare.service.QRCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/bookings")
@CrossOrigin(origins = "*")
public class BookingController {
    
    @Autowired
    private BookingService bookingService;
    
    @Autowired
    private QRCodeService qrCodeService;
    
    @PostMapping("/create")
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> bookingRequest) {
        try {
            String passengerName = (String) bookingRequest.get("passengerName");
            String passengerPhone = (String) bookingRequest.get("passengerPhone");
            Long scheduleId = Long.valueOf(bookingRequest.get("scheduleId").toString());
            String seatNumber = (String) bookingRequest.get("seatNumber");
            
            Booking booking = bookingService.createBooking(
                passengerName, passengerPhone, scheduleId, seatNumber);
            
            return ResponseEntity.ok(booking);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/{bookingReference}")
    public ResponseEntity<Booking> getBooking(@PathVariable String bookingReference) {
        Optional<Booking> booking = bookingService.getBookingByReference(bookingReference);
        return booking.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/passenger/{phone}")
    public ResponseEntity<List<Booking>> getBookingsByPhone(@PathVariable String phone) {
        List<Booking> bookings = bookingService.getBookingsByPhone(phone);
        return ResponseEntity.ok(bookings);
    }
    
    @PostMapping("/{bookingReference}/payment")
    public ResponseEntity<?> updatePaymentStatus(
            @PathVariable String bookingReference,
            @RequestBody Map<String, String> paymentData) {
        
        String transactionId = paymentData.get("transactionId");
        Booking updatedBooking = bookingService.updatePaymentStatus(bookingReference, transactionId);
        
        if (updatedBooking != null) {
            return ResponseEntity.ok(updatedBooking);
        }
        return ResponseEntity.notFound().build();
    }
    
    @GetMapping("/{bookingReference}/qr")
    public ResponseEntity<?> getQRCode(@PathVariable String bookingReference) {
        Optional<Booking> bookingOpt = bookingService.getBookingByReference(bookingReference);
        
        if (bookingOpt.isPresent()) {
            Booking booking = bookingOpt.get();
            String qrCodeDataURL = qrCodeService.generateQRCodeDataURL(booking.getQrCodeData());
            
            return ResponseEntity.ok(Map.of(
                "qrCode", qrCodeDataURL,
                "qrData", booking.getQrCodeData()
            ));
        }
        
        return ResponseEntity.notFound().build();
    }
}