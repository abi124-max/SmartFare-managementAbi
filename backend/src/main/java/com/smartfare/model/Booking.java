package com.smartfare.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "booking_reference", unique = true, nullable = false)
    private String bookingReference;
    
    @ManyToOne
    @JoinColumn(name = "passenger_id", nullable = false)
    private Passenger passenger;
    
    @ManyToOne
    @JoinColumn(name = "schedule_id", nullable = false)
    private BusSchedule schedule;
    
    @Column(name = "seat_number", nullable = false)
    private String seatNumber;
    
    @Column(name = "fare_amount", nullable = false, precision = 8, scale = 2)
    private BigDecimal fareAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    
    @Column(name = "payment_method")
    private String paymentMethod = "UPI";
    
    @Column(name = "payment_transaction_id")
    private String paymentTransactionId;
    
    @Column(name = "qr_code_data", columnDefinition = "TEXT")
    private String qrCodeData;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "booking_status")
    private BookingStatus bookingStatus = BookingStatus.CONFIRMED;
    
    @Column(name = "booking_date")
    private LocalDateTime bookingDate = LocalDateTime.now();

    public enum PaymentStatus {
        PENDING, COMPLETED, FAILED, REFUNDED
    }

    public enum BookingStatus {
        CONFIRMED, CANCELLED, COMPLETED
    }

    // Constructors
    public Booking() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBookingReference() { return bookingReference; }
    public void setBookingReference(String bookingReference) { this.bookingReference = bookingReference; }

    public Passenger getPassenger() { return passenger; }
    public void setPassenger(Passenger passenger) { this.passenger = passenger; }

    public BusSchedule getSchedule() { return schedule; }
    public void setSchedule(BusSchedule schedule) { this.schedule = schedule; }

    public String getSeatNumber() { return seatNumber; }
    public void setSeatNumber(String seatNumber) { this.seatNumber = seatNumber; }

    public BigDecimal getFareAmount() { return fareAmount; }
    public void setFareAmount(BigDecimal fareAmount) { this.fareAmount = fareAmount; }

    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentTransactionId() { return paymentTransactionId; }
    public void setPaymentTransactionId(String paymentTransactionId) { 
        this.paymentTransactionId = paymentTransactionId; 
    }

    public String getQrCodeData() { return qrCodeData; }
    public void setQrCodeData(String qrCodeData) { this.qrCodeData = qrCodeData; }

    public BookingStatus getBookingStatus() { return bookingStatus; }
    public void setBookingStatus(BookingStatus bookingStatus) { this.bookingStatus = bookingStatus; }

    public LocalDateTime getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDateTime bookingDate) { this.bookingDate = bookingDate; }
}