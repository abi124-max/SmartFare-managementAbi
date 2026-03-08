package com.smartfare.repository;

import com.smartfare.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    Optional<Booking> findByBookingReference(String bookingReference);
    
    List<Booking> findByPassengerPhone(String phone);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.schedule.id = :scheduleId AND b.bookingStatus = 'CONFIRMED'")
    Long countConfirmedBookingsBySchedule(@Param("scheduleId") Long scheduleId);
    
    @Query("SELECT b.seatNumber FROM Booking b WHERE b.schedule.id = :scheduleId AND b.bookingStatus = 'CONFIRMED'")
    List<String> findBookedSeatsBySchedule(@Param("scheduleId") Long scheduleId);
}