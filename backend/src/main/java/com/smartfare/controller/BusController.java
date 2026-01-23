package com.smartfare.controller;

import com.smartfare.model.BusSchedule;
import com.smartfare.model.Location;
import com.smartfare.service.BusService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/buses")
@CrossOrigin(origins = "*")
public class BusController {
    
    @Autowired
    private BusService busService;
    
    @GetMapping("/locations")
    public ResponseEntity<List<Location>> getAllLocations() {
        List<Location> locations = busService.getAllLocations();
        return ResponseEntity.ok(locations);
    }
    
    @GetMapping("/locations/search")
    public ResponseEntity<List<Location>> searchLocations(@RequestParam String q) {
        List<Location> locations = busService.searchLocations(q);
        return ResponseEntity.ok(locations);
    }
    
    @GetMapping("/search")
    public ResponseEntity<?> searchBuses(
            @RequestParam Long fromLocationId,
            @RequestParam Long toLocationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate travelDate) {
        
        try {
            if (fromLocationId == null || toLocationId == null || travelDate == null) {
                return ResponseEntity.badRequest().body("All parameters are required");
            }
            
            if (fromLocationId.equals(toLocationId)) {
                return ResponseEntity.badRequest().body("From and To locations cannot be the same");
            }
            
            List<BusSchedule> availableBuses = busService.getAvailableBuses(
                fromLocationId, toLocationId, travelDate);
            
            return ResponseEntity.ok(availableBuses);
            
        } catch (Exception e) {
            System.err.println("Error in searchBuses: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error searching buses: " + e.getMessage());
        }
    }
    
    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<BusSchedule> getBusSchedule(@PathVariable Long scheduleId) {
        BusSchedule schedule = busService.getBusScheduleById(scheduleId);
        if (schedule != null) {
            return ResponseEntity.ok(schedule);
        }
        return ResponseEntity.notFound().build();
    }
}