package com.smartfare.service;

import com.smartfare.model.BusSchedule;
import com.smartfare.model.Location;
import com.smartfare.repository.BusScheduleRepository;
import com.smartfare.repository.LocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class BusService {
    
    @Autowired
    private BusScheduleRepository busScheduleRepository;
    
    @Autowired
    private LocationRepository locationRepository;
    
    public List<Location> getAllLocations() {
        return locationRepository.findAll();
    }
    
    public List<Location> searchLocations(String searchTerm) {
        return locationRepository.findByNameOrCityContaining(searchTerm);
    }
    
    public List<BusSchedule> getAvailableBuses(Long fromLocationId, Long toLocationId, LocalDate travelDate) {
        try {
            if (fromLocationId == null || toLocationId == null || travelDate == null) {
                throw new IllegalArgumentException("All parameters are required");
            }
            
            if (fromLocationId.equals(toLocationId)) {
                throw new IllegalArgumentException("From and To locations cannot be the same");
            }
            
            List<BusSchedule> schedules = busScheduleRepository.findAvailableBuses(fromLocationId, toLocationId, travelDate);
            return schedules != null ? schedules : List.of();
            
        } catch (Exception e) {
            System.err.println("Error in getAvailableBuses: " + e.getMessage());
            e.printStackTrace();
            return List.of(); // Return empty list instead of crashing
        }
    }
    
    public BusSchedule getBusScheduleById(Long scheduleId) {
        return busScheduleRepository.findById(scheduleId).orElse(null);
    }
    
    public void updateAvailableSeats(Long scheduleId, int seatsToReduce) {
        BusSchedule schedule = busScheduleRepository.findById(scheduleId).orElse(null);
        if (schedule != null) {
            schedule.setAvailableSeats(schedule.getAvailableSeats() - seatsToReduce);
            busScheduleRepository.save(schedule);
        }
    }
}