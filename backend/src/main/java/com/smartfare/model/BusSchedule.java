package com.smartfare.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "bus_schedules")
public class BusSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;
    
    @ManyToOne
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;
    
    @Column(name = "departure_time", nullable = false)
    private LocalTime departureTime;
    
    @Column(name = "arrival_time", nullable = false)
    private LocalTime arrivalTime;
    
    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal fare;
    
    @Column(name = "available_seats", nullable = false)
    private Integer availableSeats;
    
    @Column(name = "schedule_date", nullable = false)
    private LocalDate scheduleDate;
    
    @Enumerated(EnumType.STRING)
    private ScheduleStatus status = ScheduleStatus.SCHEDULED;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ScheduleStatus {
        SCHEDULED, RUNNING, COMPLETED, CANCELLED
    }

    // Constructors
    public BusSchedule() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Bus getBus() { return bus; }
    public void setBus(Bus bus) { this.bus = bus; }

    public Route getRoute() { return route; }
    public void setRoute(Route route) { this.route = route; }

    public LocalTime getDepartureTime() { return departureTime; }
    public void setDepartureTime(LocalTime departureTime) { this.departureTime = departureTime; }

    public LocalTime getArrivalTime() { return arrivalTime; }
    public void setArrivalTime(LocalTime arrivalTime) { this.arrivalTime = arrivalTime; }

    public BigDecimal getFare() { return fare; }
    public void setFare(BigDecimal fare) { this.fare = fare; }

    public Integer getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(Integer availableSeats) { this.availableSeats = availableSeats; }

    public LocalDate getScheduleDate() { return scheduleDate; }
    public void setScheduleDate(LocalDate scheduleDate) { this.scheduleDate = scheduleDate; }

    public ScheduleStatus getStatus() { return status; }
    public void setStatus(ScheduleStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}