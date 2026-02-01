package com.smartfare.config;

import com.smartfare.model.*;
import com.smartfare.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private LocationRepository locationRepository;
    
    @Autowired
    private BusTypeRepository busTypeRepository;
    
    @Autowired
    private BusRepository busRepository;
    
    @Autowired
    private RouteRepository routeRepository;
    
    @Autowired
    private BusScheduleRepository busScheduleRepository;

    @Override
    public void run(String... args) throws Exception {
        initializeData();
    }

    private void initializeData() {
        try {
            System.out.println("🚀 Initializing Smart Fare database with sample data...");
            
            // Check if data already exists
            if (locationRepository.count() > 0) {
                System.out.println("✅ Database already contains " + locationRepository.count() + " locations. Skipping initialization.");
                return;
            }
            
            System.out.println("📊 Creating fresh database with sample data...");
            
            // Create locations
            List<Location> locations = new ArrayList<>();
            locations.add(createLocation("Koyambedu Bus Terminal", "Chennai", "Tamil Nadu", 13.0732, 80.1986));
            locations.add(createLocation("Tambaram Bus Stand", "Chennai", "Tamil Nadu", 12.9249, 80.1000));
            locations.add(createLocation("Velachery Bus Depot", "Chennai", "Tamil Nadu", 12.9759, 80.2207));
            locations.add(createLocation("Broadway Bus Terminal", "Chennai", "Tamil Nadu", 13.0878, 80.2785));

            locationRepository.saveAll(locations);
            System.out.println("✅ Created 4 locations");

            // Create bus types
            List<BusType> busTypes = new ArrayList<>();
            busTypes.add(createBusType("AC Deluxe", "Air conditioned deluxe bus with comfortable seating"));
            busTypes.add(createBusType("Ordinary", "Regular city bus service"));
            busTypes.add(createBusType("AC Express", "Air conditioned express bus service"));
            busTypes.add(createBusType("Volvo AC", "Premium Volvo bus with luxury amenities"));

            busTypeRepository.saveAll(busTypes);
            System.out.println("✅ Created 4 bus types");

            // Create buses
            List<Bus> buses = new ArrayList<>();
            buses.add(createBus("TN09N2345", busTypes.get(0), 40, "MTC Chennai"));
            buses.add(createBus("TN09P4567", busTypes.get(1), 50, "TNSTC"));
            buses.add(createBus("TN09Q7890", busTypes.get(2), 45, "Parveen Travels"));
            buses.add(createBus("TN09R1234", busTypes.get(3), 35, "KPN Travels"));

            busRepository.saveAll(buses);
            System.out.println("✅ Created 4 buses");

            // Create routes
            List<Route> routes = new ArrayList<>();
            routes.add(createRoute(locations.get(0), locations.get(1), "25.5", 45, "35.00")); // Koyambedu → Tambaram
            routes.add(createRoute(locations.get(1), locations.get(0), "25.5", 45, "35.00")); // Tambaram → Koyambedu
            routes.add(createRoute(locations.get(0), locations.get(2), "18.2", 35, "25.00")); // Koyambedu → Velachery
            routes.add(createRoute(locations.get(2), locations.get(0), "18.2", 35, "25.00")); // Velachery → Koyambedu
            routes.add(createRoute(locations.get(0), locations.get(3), "12.5", 25, "20.00")); // Koyambedu → Broadway
            routes.add(createRoute(locations.get(3), locations.get(0), "12.5", 25, "20.00")); // Broadway → Koyambedu
            routes.add(createRoute(locations.get(3), locations.get(1), "30.8", 50, "40.00")); // Broadway → Tambaram
            routes.add(createRoute(locations.get(1), locations.get(3), "30.8", 50, "40.00")); // Tambaram → Broadway
            routes.add(createRoute(locations.get(3), locations.get(2), "22.5", 40, "30.00")); // Broadway → Velachery
            routes.add(createRoute(locations.get(2), locations.get(3), "22.5", 40, "30.00")); // Velachery → Broadway
            routes.add(createRoute(locations.get(1), locations.get(2), "15.8", 30, "25.00")); // Tambaram → Velachery
            routes.add(createRoute(locations.get(2), locations.get(1), "15.8", 30, "25.00")); // Velachery → Tambaram

            routeRepository.saveAll(routes);
            System.out.println("✅ Created 12 routes");

            // Create schedules
            LocalDate today = LocalDate.now();
            LocalDate tomorrow = today.plusDays(1);
            List<BusSchedule> schedules = new ArrayList<>();

            // Today's schedules
            schedules.add(createSchedule(buses.get(0), routes.get(0), LocalTime.of(6, 0), LocalTime.of(6, 45), new BigDecimal("45.00"), 35, today));
            schedules.add(createSchedule(buses.get(1), routes.get(0), LocalTime.of(8, 30), LocalTime.of(9, 15), new BigDecimal("35.00"), 45, today));
            schedules.add(createSchedule(buses.get(2), routes.get(0), LocalTime.of(14, 0), LocalTime.of(14, 45), new BigDecimal("40.00"), 40, today));
            schedules.add(createSchedule(buses.get(3), routes.get(0), LocalTime.of(20, 0), LocalTime.of(20, 45), new BigDecimal("50.00"), 30, today));

            schedules.add(createSchedule(buses.get(0), routes.get(1), LocalTime.of(7, 30), LocalTime.of(8, 15), new BigDecimal("45.00"), 38, today));
            schedules.add(createSchedule(buses.get(1), routes.get(1), LocalTime.of(10, 0), LocalTime.of(10, 45), new BigDecimal("35.00"), 48, today));
            schedules.add(createSchedule(buses.get(2), routes.get(1), LocalTime.of(16, 30), LocalTime.of(17, 15), new BigDecimal("40.00"), 42, today));
            schedules.add(createSchedule(buses.get(3), routes.get(1), LocalTime.of(21, 30), LocalTime.of(22, 15), new BigDecimal("50.00"), 32, today));

            // Add more schedules for other routes...
            schedules.add(createSchedule(buses.get(0), routes.get(2), LocalTime.of(7, 0), LocalTime.of(7, 35), new BigDecimal("35.00"), 38, today));
            schedules.add(createSchedule(buses.get(2), routes.get(2), LocalTime.of(15, 30), LocalTime.of(16, 5), new BigDecimal("30.00"), 42, today));
            schedules.add(createSchedule(buses.get(3), routes.get(2), LocalTime.of(19, 0), LocalTime.of(19, 35), new BigDecimal("40.00"), 33, today));

            // Tomorrow's schedules (sample)
            schedules.add(createSchedule(buses.get(0), routes.get(0), LocalTime.of(6, 0), LocalTime.of(6, 45), new BigDecimal("45.00"), 40, tomorrow));
            schedules.add(createSchedule(buses.get(1), routes.get(0), LocalTime.of(8, 30), LocalTime.of(9, 15), new BigDecimal("35.00"), 50, tomorrow));
            schedules.add(createSchedule(buses.get(2), routes.get(1), LocalTime.of(16, 30), LocalTime.of(17, 15), new BigDecimal("40.00"), 45, tomorrow));
            schedules.add(createSchedule(buses.get(3), routes.get(5), LocalTime.of(21, 0), LocalTime.of(21, 30), new BigDecimal("40.00"), 35, tomorrow));

            busScheduleRepository.saveAll(schedules);
            System.out.println("✅ Created " + schedules.size() + " bus schedules");

            System.out.println("🎉 Smart Fare database initialization completed successfully!");
            System.out.println("📈 Summary: " + locations.size() + " locations, " + buses.size() + " buses, " + routes.size() + " routes, " + schedules.size() + " schedules");

        } catch (Exception e) {
            System.err.println("❌ Error during database initialization: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private Location createLocation(String name, String city, String state, double latitude, double longitude) {
        Location location = new Location(name, city, state);
        location.setLatitude(latitude);
        location.setLongitude(longitude);
        return location;
    }

    private BusType createBusType(String typeName, String description) {
        BusType busType = new BusType();
        busType.setTypeName(typeName);
        busType.setDescription(description);
        return busType;
    }

    private Bus createBus(String busNumber, BusType busType, int totalSeats, String operatorName) {
        Bus bus = new Bus();
        bus.setBusNumber(busNumber);
        bus.setBusType(busType);
        bus.setTotalSeats(totalSeats);
        bus.setOperatorName(operatorName);
        bus.setStatus(Bus.BusStatus.ACTIVE);
        return bus;
    }

    private Route createRoute(Location from, Location to, String distance, int duration, String fare) {
        Route route = new Route();
        route.setFromLocation(from);
        route.setToLocation(to);
        route.setDistanceKm(new BigDecimal(distance));
        route.setEstimatedDurationMinutes(duration);
        route.setBaseFare(new BigDecimal(fare));
        return route;
    }

    private BusSchedule createSchedule(Bus bus, Route route, LocalTime departure, LocalTime arrival, 
                               BigDecimal fare, int availableSeats, LocalDate date) {
        BusSchedule schedule = new BusSchedule();
        schedule.setBus(bus);
        schedule.setRoute(route);
        schedule.setDepartureTime(departure);
        schedule.setArrivalTime(arrival);
        schedule.setFare(fare);
        schedule.setAvailableSeats(availableSeats);
        schedule.setScheduleDate(date);
        return busScheduleRepository.save(schedule);
    }
}
