package com.smartfare.repository;

import com.smartfare.model.BusSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface BusScheduleRepository extends JpaRepository<BusSchedule, Long> {
    
    @Query("SELECT bs FROM BusSchedule bs " +
           "JOIN bs.route r " +
           "WHERE r.fromLocation.id = :fromLocationId " +
           "AND r.toLocation.id = :toLocationId " +
           "AND bs.scheduleDate = :scheduleDate " +
           "AND bs.availableSeats > 0 " +
           "AND bs.status = 'SCHEDULED' " +
           "ORDER BY bs.departureTime")
    List<BusSchedule> findAvailableBuses(
        @Param("fromLocationId") Long fromLocationId,
        @Param("toLocationId") Long toLocationId,
        @Param("scheduleDate") LocalDate scheduleDate
    );
    
    @Query("SELECT bs FROM BusSchedule bs WHERE bs.scheduleDate = :date")
    List<BusSchedule> findByScheduleDate(@Param("date") LocalDate date);
}