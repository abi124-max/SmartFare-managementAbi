package com.smartfare.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.smartfare.repository.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired
    private LocationRepository locationRepository;
    
    @Autowired
    private BusRepository busRepository;
    
    @Autowired
    private RouteRepository routeRepository;
    
    @Autowired
    private BusScheduleRepository busScheduleRepository;

    @GetMapping
    public Map<String, Object> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        
        try {
            health.put("status", "UP");
            health.put("timestamp", System.currentTimeMillis());
            health.put("application", "Smart Fare Management System");
            
            // Database statistics
            Map<String, Object> database = new HashMap<>();
            database.put("status", "CONNECTED");
            database.put("locations", locationRepository.count());
            database.put("buses", busRepository.count());
            database.put("routes", routeRepository.count());
            database.put("schedules", busScheduleRepository.count());
            health.put("database", database);
            
            // System info
            Map<String, Object> system = new HashMap<>();
            system.put("javaVersion", System.getProperty("java.version"));
            system.put("availableProcessors", Runtime.getRuntime().availableProcessors());
            system.put("freeMemory", Runtime.getRuntime().freeMemory());
            system.put("totalMemory", Runtime.getRuntime().totalMemory());
            health.put("system", system);
            
        } catch (Exception e) {
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
        }
        
        return health;
    }
    
    @GetMapping("/database")
    public Map<String, Object> databaseHealth() {
        Map<String, Object> db = new HashMap<>();
        
        try {
            long locations = locationRepository.count();
            long buses = busRepository.count();
            long routes = routeRepository.count();
            long schedules = busScheduleRepository.count();
            
            db.put("status", "HEALTHY");
            db.put("locations", locations);
            db.put("buses", buses);
            db.put("routes", routes);
            db.put("schedules", schedules);
            
            // Check if data is properly initialized
            if (locations == 0 || buses == 0 || routes == 0 || schedules == 0) {
                db.put("status", "EMPTY");
                db.put("message", "Database is empty - data initialization may be needed");
            }
            
        } catch (Exception e) {
            db.put("status", "ERROR");
            db.put("error", e.getMessage());
        }
        
        return db;
    }
}
