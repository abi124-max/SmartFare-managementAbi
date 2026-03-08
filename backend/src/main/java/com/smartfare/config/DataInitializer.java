package com.smartfare.config;

import com.smartfare.model.*;
import com.smartfare.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
                System.out.println("✅ Database already contains " + locationRepository.count()
                        + " locations. Skipping initialization.");
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

            // Create schedules for multiple dates (today, next 7 days)
            LocalDate today = LocalDate.now();
            List<BusSchedule> schedules = new ArrayList<>();
            
            // Create schedules for today and next 7 days
            for (int i = 0; i <= 7; i++) {
                LocalDate currentDate = today.plusDays(i);
                
                // Koyambedu → Tambaram (4 buses per day)
                schedules.add(createSchedule(buses.get(0), routes.get(0), LocalTime.of(6, 0), LocalTime.of(6, 45), new BigDecimal("45.00"), 35, currentDate));
                schedules.add(createSchedule(buses.get(1), routes.get(0), LocalTime.of(8, 30), LocalTime.of(9, 15), new BigDecimal("35.00"), 45, currentDate));
                schedules.add(createSchedule(buses.get(2), routes.get(0), LocalTime.of(14, 0), LocalTime.of(14, 45), new BigDecimal("40.00"), 40, currentDate));
                schedules.add(createSchedule(buses.get(3), routes.get(0), LocalTime.of(20, 0), LocalTime.of(20, 45), new BigDecimal("50.00"), 30, currentDate));
                
                // Tambaram → Koyambedu (4 buses per day)
                schedules.add(createSchedule(buses.get(0), routes.get(1), LocalTime.of(7, 0), LocalTime.of(7, 45), new BigDecimal("45.00"), 38, currentDate));
                schedules.add(createSchedule(buses.get(1), routes.get(1), LocalTime.of(10, 0), LocalTime.of(10, 45), new BigDecimal("35.00"), 48, currentDate));
                schedules.add(createSchedule(buses.get(2), routes.get(1), LocalTime.of(16, 0), LocalTime.of(16, 45), new BigDecimal("40.00"), 42, currentDate));
                schedules.add(createSchedule(buses.get(3), routes.get(1), LocalTime.of(21, 30), LocalTime.of(22, 15), new BigDecimal("50.00"), 32, currentDate));
                
                // Koyambedu → Velachery (3 buses per day)
                schedules.add(createSchedule(buses.get(0), routes.get(2), LocalTime.of(7, 0), LocalTime.of(7, 35), new BigDecimal("35.00"), 36, currentDate));
                schedules.add(createSchedule(buses.get(2), routes.get(2), LocalTime.of(15, 30), LocalTime.of(16, 5), new BigDecimal("30.00"), 40, currentDate));
                schedules.add(createSchedule(buses.get(3), routes.get(2), LocalTime.of(19, 0), LocalTime.of(19, 35), new BigDecimal("40.00"), 28, currentDate));
                
                // Velachery → Koyambedu (3 buses per day)
                schedules.add(createSchedule(buses.get(0), routes.get(3), LocalTime.of(8, 0), LocalTime.of(8, 35), new BigDecimal("35.00"), 37, currentDate));
                schedules.add(createSchedule(buses.get(1), routes.get(3), LocalTime.of(13, 0), LocalTime.of(13, 35), new BigDecimal("25.00"), 46, currentDate));
                schedules.add(createSchedule(buses.get(2), routes.get(3), LocalTime.of(18, 0), LocalTime.of(18, 35), new BigDecimal("30.00"), 41, currentDate));
                
                // Koyambedu → Broadway (4 buses per day)
                schedules.add(createSchedule(buses.get(0), routes.get(4), LocalTime.of(6, 30), LocalTime.of(6, 55), new BigDecimal("25.00"), 38, currentDate));
                schedules.add(createSchedule(buses.get(1), routes.get(4), LocalTime.of(9, 0), LocalTime.of(9, 25), new BigDecimal("20.00"), 47, currentDate));
                schedules.add(createSchedule(buses.get(2), routes.get(4), LocalTime.of(12, 30), LocalTime.of(12, 55), new BigDecimal("22.00"), 43, currentDate));
                schedules.add(createSchedule(buses.get(3), routes.get(4), LocalTime.of(17, 0), LocalTime.of(17, 25), new BigDecimal("28.00"), 31, currentDate));
                
                // Broadway → Koyambedu (4 buses per day)
                schedules.add(createSchedule(buses.get(0), routes.get(5), LocalTime.of(7, 30), LocalTime.of(7, 55), new BigDecimal("25.00"), 39, currentDate));
                schedules.add(createSchedule(buses.get(1), routes.get(5), LocalTime.of(11, 0), LocalTime.of(11, 25), new BigDecimal("20.00"), 49, currentDate));
                schedules.add(createSchedule(buses.get(2), routes.get(5), LocalTime.of(14, 30), LocalTime.of(14, 55), new BigDecimal("22.00"), 44, currentDate));
                schedules.add(createSchedule(buses.get(3), routes.get(5), LocalTime.of(19, 30), LocalTime.of(19, 55), new BigDecimal("28.00"), 33, currentDate));
                
                // Broadway → Tambaram (3 buses per day)
                schedules.add(createSchedule(buses.get(1), routes.get(6), LocalTime.of(8, 0), LocalTime.of(8, 50), new BigDecimal("40.00"), 46, currentDate));
                schedules.add(createSchedule(buses.get(2), routes.get(6), LocalTime.of(13, 30), LocalTime.of(14, 20), new BigDecimal("38.00"), 42, currentDate));
                schedules.add(createSchedule(buses.get(3), routes.get(6), LocalTime.of(18, 30), LocalTime.of(19, 20), new BigDecimal("45.00"), 32, currentDate));
                
                // Tambaram → Broadway (3 buses per day)
                schedules.add(createSchedule(buses.get(0), routes.get(7), LocalTime.of(6, 30), LocalTime.of(7, 20), new BigDecimal("40.00"), 37, currentDate));
                schedules.add(createSchedule(buses.get(1), routes.get(7), LocalTime.of(12, 0), LocalTime.of(12, 50), new BigDecimal("38.00"), 48, currentDate));
                schedules.add(createSchedule(buses.get(2), routes.get(7), LocalTime.of(17, 30), LocalTime.of(18, 20), new BigDecimal("45.00"), 43, currentDate));
                
                // Broadway → Velachery (3 buses per day)
                schedules.add(createSchedule(buses.get(0), routes.get(8), LocalTime.of(9, 0), LocalTime.of(9, 40), new BigDecimal("32.00"), 36, currentDate));
                schedules.add(createSchedule(buses.get(2), routes.get(8), LocalTime.of(14, 0), LocalTime.of(14, 40), new BigDecimal("30.00"), 41, currentDate));
                schedules.add(createSchedule(buses.get(3), routes.get(8), LocalTime.of(20, 0), LocalTime.of(20, 40), new BigDecimal("35.00"), 29, currentDate));
                
                // Velachery → Broadway (3 buses per day)
                schedules.add(createSchedule(buses.get(0), routes.get(9), LocalTime.of(7, 30), LocalTime.of(8, 10), new BigDecimal("32.00"), 38, currentDate));
                schedules.add(createSchedule(buses.get(1), routes.get(9), LocalTime.of(11, 30), LocalTime.of(12, 10), new BigDecimal("28.00"), 47, currentDate));
                schedules.add(createSchedule(buses.get(2), routes.get(9), LocalTime.of(16, 30), LocalTime.of(17, 10), new BigDecimal("30.00"), 42, currentDate));
                
                // Tambaram → Velachery (3 buses per day)
                schedules.add(createSchedule(buses.get(1), routes.get(10), LocalTime.of(8, 30), LocalTime.of(9, 0), new BigDecimal("28.00"), 45, currentDate));
                schedules.add(createSchedule(buses.get(2), routes.get(10), LocalTime.of(13, 0), LocalTime.of(13, 30), new BigDecimal("25.00"), 43, currentDate));
                schedules.add(createSchedule(buses.get(3), routes.get(10), LocalTime.of(18, 0), LocalTime.of(18, 30), new BigDecimal("30.00"), 31, currentDate));
                
                // Velachery → Tambaram (3 buses per day)
                schedules.add(createSchedule(buses.get(0), routes.get(11), LocalTime.of(9, 30), LocalTime.of(10, 0), new BigDecimal("28.00"), 39, currentDate));
                schedules.add(createSchedule(buses.get(1), routes.get(11), LocalTime.of(14, 30), LocalTime.of(15, 0), new BigDecimal("25.00"), 49, currentDate));
                schedules.add(createSchedule(buses.get(2), routes.get(11), LocalTime.of(19, 30), LocalTime.of(20, 0), new BigDecimal("30.00"), 44, currentDate));
            }

            busScheduleRepository.saveAll(schedules);
            System.out.println("✅ Created " + schedules.size() + " bus schedules for today and next 7 days");

            System.out.println("🎉 Smart Fare database initialization completed successfully!");
            System.out.println("📈 Summary: " + locations.size() + " locations, " + buses.size() + " buses, "
                    + routes.size() + " routes, " + schedules.size() + " schedules");

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
        schedule.setStatus(BusSchedule.ScheduleStatus.SCHEDULED);
        schedule.setCreatedAt(LocalDateTime.now());
        return busScheduleRepository.save(schedule);
    }
}
