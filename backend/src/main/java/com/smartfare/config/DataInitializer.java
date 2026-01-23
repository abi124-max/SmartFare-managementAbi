package com.smartfare.config;

import com.smartfare.model.*;
import com.smartfare.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

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
        // Create Chennai locations
        Location koyambedu = new Location("Koyambedu Bus Terminal", "Chennai", "Tamil Nadu");
        koyambedu.setLatitude(13.0732);
        koyambedu.setLongitude(80.1986);
        
        Location tambaram = new Location("Tambaram Bus Stand", "Chennai", "Tamil Nadu");
        tambaram.setLatitude(12.9249);
        tambaram.setLongitude(80.1000);
        
        Location velachery = new Location("Velachery Bus Depot", "Chennai", "Tamil Nadu");
        velachery.setLatitude(12.9759);
        velachery.setLongitude(80.2207);
        
        Location broadway = new Location("Broadway Bus Terminal", "Chennai", "Tamil Nadu");
        broadway.setLatitude(13.0878);
        broadway.setLongitude(80.2785);

        locationRepository.save(koyambedu);
        locationRepository.save(tambaram);
        locationRepository.save(velachery);
        locationRepository.save(broadway);

        // Create bus types
        BusType acSleeper = new BusType();
        acSleeper.setTypeName("AC Deluxe");
        acSleeper.setDescription("Air conditioned deluxe bus with comfortable seating");
        
        BusType nonAcSeater = new BusType();
        nonAcSeater.setTypeName("Ordinary");
        nonAcSeater.setDescription("Regular city bus service");
        
        BusType acSeater = new BusType();
        acSeater.setTypeName("AC Express");
        acSeater.setDescription("Air conditioned express bus service");
        
        BusType volvoAc = new BusType();
        volvoAc.setTypeName("Volvo AC");
        volvoAc.setDescription("Premium Volvo bus with luxury amenities");

        busTypeRepository.save(acSleeper);
        busTypeRepository.save(nonAcSeater);
        busTypeRepository.save(acSeater);
        busTypeRepository.save(volvoAc);

        // Create buses
        Bus bus1 = new Bus();
        bus1.setBusNumber("TN09N2345");
        bus1.setBusType(acSleeper);
        bus1.setTotalSeats(40);
        bus1.setOperatorName("MTC Chennai");
        
        Bus bus2 = new Bus();
        bus2.setBusNumber("TN09P4567");
        bus2.setBusType(nonAcSeater);
        bus2.setTotalSeats(50);
        bus2.setOperatorName("TNSTC");
        
        Bus bus3 = new Bus();
        bus3.setBusNumber("TN09Q7890");
        bus3.setBusType(acSeater);
        bus3.setTotalSeats(45);
        bus3.setOperatorName("Parveen Travels");
        
        Bus bus4 = new Bus();
        bus4.setBusNumber("TN09R1234");
        bus4.setBusType(volvoAc);
        bus4.setTotalSeats(35);
        bus4.setOperatorName("KPN Travels");

        busRepository.save(bus1);
        busRepository.save(bus2);
        busRepository.save(bus3);
        busRepository.save(bus4);

        // Create comprehensive bidirectional routes for all location combinations
        
        // Koyambedu ↔ Tambaram
        Route koyambeduToTambaram = createRoute(koyambedu, tambaram, "25.5", 45, "35.00");
        Route tambaramToKoyambedu = createRoute(tambaram, koyambedu, "25.5", 45, "35.00");
        
        // Koyambedu ↔ Velachery
        Route koyambeduToVelachery = createRoute(koyambedu, velachery, "18.2", 35, "25.00");
        Route velacheryToKoyambedu = createRoute(velachery, koyambedu, "18.2", 35, "25.00");
        
        // Koyambedu ↔ Broadway
        Route koyambeduToBroadway = createRoute(koyambedu, broadway, "12.5", 25, "20.00");
        Route broadwayToKoyambedu = createRoute(broadway, koyambedu, "12.5", 25, "20.00");
        
        // Broadway ↔ Tambaram
        Route broadwayToTambaram = createRoute(broadway, tambaram, "30.8", 50, "40.00");
        Route tambaramToBroadway = createRoute(tambaram, broadway, "30.8", 50, "40.00");
        
        // Broadway ↔ Velachery
        Route broadwayToVelachery = createRoute(broadway, velachery, "22.5", 40, "30.00");
        Route velacheryToBroadway = createRoute(velachery, broadway, "22.5", 40, "30.00");
        
        // Tambaram ↔ Velachery
        Route tambaramToVelachery = createRoute(tambaram, velachery, "15.8", 30, "25.00");
        Route velacheryToTambaram = createRoute(velachery, tambaram, "15.8", 30, "25.00");

        // Save all routes
        routeRepository.save(koyambeduToTambaram);
        routeRepository.save(tambaramToKoyambedu);
        routeRepository.save(koyambeduToVelachery);
        routeRepository.save(velacheryToKoyambedu);
        routeRepository.save(koyambeduToBroadway);
        routeRepository.save(broadwayToKoyambedu);
        routeRepository.save(broadwayToTambaram);
        routeRepository.save(tambaramToBroadway);
        routeRepository.save(broadwayToVelachery);
        routeRepository.save(velacheryToBroadway);
        routeRepository.save(tambaramToVelachery);
        routeRepository.save(velacheryToTambaram);

        // Create comprehensive bus schedules for all routes
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);
        
        // Koyambedu → Tambaram (4 buses)
        createSchedule(bus1, koyambeduToTambaram, LocalTime.of(6, 0), LocalTime.of(6, 45), new BigDecimal("45.00"), 35, today);
        createSchedule(bus2, koyambeduToTambaram, LocalTime.of(8, 30), LocalTime.of(9, 15), new BigDecimal("35.00"), 45, today);
        createSchedule(bus3, koyambeduToTambaram, LocalTime.of(14, 0), LocalTime.of(14, 45), new BigDecimal("40.00"), 40, today);
        createSchedule(bus4, koyambeduToTambaram, LocalTime.of(20, 0), LocalTime.of(20, 45), new BigDecimal("50.00"), 30, today);
        
        // Tambaram → Koyambedu (4 buses)
        createSchedule(bus1, tambaramToKoyambedu, LocalTime.of(7, 30), LocalTime.of(8, 15), new BigDecimal("45.00"), 38, today);
        createSchedule(bus2, tambaramToKoyambedu, LocalTime.of(10, 0), LocalTime.of(10, 45), new BigDecimal("35.00"), 48, today);
        createSchedule(bus3, tambaramToKoyambedu, LocalTime.of(16, 30), LocalTime.of(17, 15), new BigDecimal("40.00"), 42, today);
        createSchedule(bus4, tambaramToKoyambedu, LocalTime.of(21, 30), LocalTime.of(22, 15), new BigDecimal("50.00"), 32, today);
        
        // Koyambedu → Velachery (3 buses)
        createSchedule(bus1, koyambeduToVelachery, LocalTime.of(7, 0), LocalTime.of(7, 35), new BigDecimal("35.00"), 38, today);
        createSchedule(bus3, koyambeduToVelachery, LocalTime.of(15, 30), LocalTime.of(16, 5), new BigDecimal("30.00"), 42, today);
        createSchedule(bus4, koyambeduToVelachery, LocalTime.of(19, 0), LocalTime.of(19, 35), new BigDecimal("40.00"), 33, today);
        
        // Velachery → Koyambedu (3 buses)
        createSchedule(bus1, velacheryToKoyambedu, LocalTime.of(8, 15), LocalTime.of(8, 50), new BigDecimal("35.00"), 36, today);
        createSchedule(bus2, velacheryToKoyambedu, LocalTime.of(12, 0), LocalTime.of(12, 35), new BigDecimal("25.00"), 47, today);
        createSchedule(bus3, velacheryToKoyambedu, LocalTime.of(17, 45), LocalTime.of(18, 20), new BigDecimal("30.00"), 41, today);
        
        // Koyambedu → Broadway (2 buses)
        createSchedule(bus2, koyambeduToBroadway, LocalTime.of(9, 0), LocalTime.of(9, 25), new BigDecimal("20.00"), 46, today);
        createSchedule(bus3, koyambeduToBroadway, LocalTime.of(18, 0), LocalTime.of(18, 25), new BigDecimal("25.00"), 43, today);
        
        // Broadway → Koyambedu (2 buses)
        createSchedule(bus2, broadwayToKoyambedu, LocalTime.of(10, 30), LocalTime.of(10, 55), new BigDecimal("20.00"), 44, today);
        createSchedule(bus4, broadwayToKoyambedu, LocalTime.of(22, 0), LocalTime.of(22, 25), new BigDecimal("30.00"), 31, today);
        
        // Broadway → Tambaram (3 buses)
        createSchedule(bus1, broadwayToTambaram, LocalTime.of(11, 0), LocalTime.of(11, 50), new BigDecimal("50.00"), 37, today);
        createSchedule(bus2, broadwayToTambaram, LocalTime.of(13, 30), LocalTime.of(14, 20), new BigDecimal("40.00"), 46, today);
        createSchedule(bus4, broadwayToTambaram, LocalTime.of(17, 0), LocalTime.of(17, 50), new BigDecimal("55.00"), 29, today);
        
        // Tambaram → Broadway (3 buses)
        createSchedule(bus1, tambaramToBroadway, LocalTime.of(12, 30), LocalTime.of(13, 20), new BigDecimal("50.00"), 39, today);
        createSchedule(bus3, tambaramToBroadway, LocalTime.of(15, 0), LocalTime.of(15, 50), new BigDecimal("45.00"), 41, today);
        createSchedule(bus4, tambaramToBroadway, LocalTime.of(18, 30), LocalTime.of(19, 20), new BigDecimal("55.00"), 28, today);
        
        // Broadway → Velachery (2 buses)
        createSchedule(bus2, broadwayToVelachery, LocalTime.of(11, 30), LocalTime.of(12, 10), new BigDecimal("30.00"), 45, today);
        createSchedule(bus3, broadwayToVelachery, LocalTime.of(16, 0), LocalTime.of(16, 40), new BigDecimal("35.00"), 40, today);
        
        // Velachery → Broadway (2 buses)
        createSchedule(bus1, velacheryToBroadway, LocalTime.of(13, 0), LocalTime.of(13, 40), new BigDecimal("35.00"), 37, today);
        createSchedule(bus4, velacheryToBroadway, LocalTime.of(20, 30), LocalTime.of(21, 10), new BigDecimal("40.00"), 30, today);
        
        // Tambaram → Velachery (3 buses)
        createSchedule(bus1, tambaramToVelachery, LocalTime.of(9, 30), LocalTime.of(10, 0), new BigDecimal("30.00"), 36, today);
        createSchedule(bus2, tambaramToVelachery, LocalTime.of(14, 30), LocalTime.of(15, 0), new BigDecimal("25.00"), 47, today);
        createSchedule(bus3, tambaramToVelachery, LocalTime.of(19, 30), LocalTime.of(20, 0), new BigDecimal("35.00"), 39, today);
        
        // Velachery → Tambaram (3 buses)
        createSchedule(bus2, velacheryToTambaram, LocalTime.of(10, 30), LocalTime.of(11, 0), new BigDecimal("25.00"), 48, today);
        createSchedule(bus3, velacheryToTambaram, LocalTime.of(15, 30), LocalTime.of(16, 0), new BigDecimal("35.00"), 40, today);
        createSchedule(bus4, velacheryToTambaram, LocalTime.of(21, 0), LocalTime.of(21, 30), new BigDecimal("40.00"), 31, today);
        
        // Tomorrow's schedules (sample for major routes)
        createSchedule(bus1, koyambeduToTambaram, LocalTime.of(6, 0), LocalTime.of(6, 45), new BigDecimal("45.00"), 40, tomorrow);
        createSchedule(bus2, koyambeduToTambaram, LocalTime.of(8, 30), LocalTime.of(9, 15), new BigDecimal("35.00"), 50, tomorrow);
        createSchedule(bus3, tambaramToKoyambedu, LocalTime.of(16, 30), LocalTime.of(17, 15), new BigDecimal("40.00"), 45, tomorrow);
        createSchedule(bus4, velacheryToTambaram, LocalTime.of(21, 0), LocalTime.of(21, 30), new BigDecimal("40.00"), 35, tomorrow);
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

    private void createSchedule(Bus bus, Route route, LocalTime departure, LocalTime arrival, 
                               BigDecimal fare, int availableSeats, LocalDate date) {
        BusSchedule schedule = new BusSchedule();
        schedule.setBus(bus);
        schedule.setRoute(route);
        schedule.setDepartureTime(departure);
        schedule.setArrivalTime(arrival);
        schedule.setFare(fare);
        schedule.setAvailableSeats(availableSeats);
        schedule.setScheduleDate(date);
        busScheduleRepository.save(schedule);
    }
}