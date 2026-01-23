package com.smartfare.service;

import com.smartfare.model.Booking;
import com.smartfare.model.BusSchedule;
import com.smartfare.model.Passenger;
import com.smartfare.repository.BookingRepository;
import com.smartfare.repository.PassengerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BookingService {
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private PassengerRepository passengerRepository;
    
    @Autowired
    private BusService busService;
    
    @Autowired
    private QRCodeService qrCodeService;
    
    @Transactional
    public Booking createBooking(String passengerName, String passengerPhone, 
                               Long scheduleId, String seatNumber) {
        
        // Find or create passenger
        Passenger passenger = passengerRepository.findByPhone(passengerPhone)
            .orElse(new Passenger(passengerName, passengerPhone));
        
        // Update passenger name if it has changed
        if (!passenger.getName().equals(passengerName)) {
            passenger.setName(passengerName);
        }
        
        passenger = passengerRepository.save(passenger);
        
        // Get bus schedule
        BusSchedule schedule = busService.getBusScheduleById(scheduleId);
        if (schedule == null || schedule.getAvailableSeats() <= 0) {
            throw new RuntimeException("Bus not available or no seats left");
        }
        
        // Check if seat is already booked
        List<String> bookedSeats = bookingRepository.findBookedSeatsBySchedule(scheduleId);
        if (bookedSeats.contains(seatNumber)) {
            throw new RuntimeException("Seat already booked");
        }
        
        // Create booking
        Booking booking = new Booking();
        booking.setBookingReference(generateBookingReference());
        booking.setPassenger(passenger);
        booking.setSchedule(schedule);
        booking.setSeatNumber(seatNumber);
        booking.setFareAmount(schedule.getFare());
        
        // Generate QR code data
        String qrData = generateQRData(booking);
        booking.setQrCodeData(qrData);
        
        // Save booking
        booking = bookingRepository.save(booking);
        
        // Update available seats
        busService.updateAvailableSeats(scheduleId, 1);
        
        return booking;
    }
    
    public Optional<Booking> getBookingByReference(String bookingReference) {
        return bookingRepository.findByBookingReference(bookingReference);
    }
    
    public List<Booking> getBookingsByPhone(String phone) {
        return bookingRepository.findByPassengerPhone(phone);
    }
    
    public Booking updatePaymentStatus(String bookingReference, String transactionId) {
        Optional<Booking> bookingOpt = bookingRepository.findByBookingReference(bookingReference);
        if (bookingOpt.isPresent()) {
            Booking booking = bookingOpt.get();
            booking.setPaymentStatus(Booking.PaymentStatus.COMPLETED);
            booking.setPaymentTransactionId(transactionId);
            return bookingRepository.save(booking);
        }
        return null;
    }
    
    private String generateBookingReference() {
        return "SF" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }
    
    private String generateQRData(Booking booking) {
        return String.format("BOOKING:%s|PASSENGER:%s|BUS:%s|SEAT:%s|DATE:%s|FARE:%.2f",
            booking.getBookingReference(),
            booking.getPassenger().getName(),
            booking.getSchedule().getBus().getBusNumber(),
            booking.getSeatNumber(),
            booking.getSchedule().getScheduleDate(),
            booking.getFareAmount()
        );
    }
}