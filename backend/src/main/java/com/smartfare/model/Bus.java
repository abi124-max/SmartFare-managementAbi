package com.smartfare.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "buses")
public class Bus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "bus_number", unique = true, nullable = false)
    private String busNumber;
    
    @ManyToOne
    @JoinColumn(name = "bus_type_id")
    private BusType busType;
    
    @Column(name = "total_seats", nullable = false)
    private Integer totalSeats;
    
    @Column(name = "operator_name", nullable = false)
    private String operatorName;
    
    @Enumerated(EnumType.STRING)
    private BusStatus status = BusStatus.ACTIVE;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum BusStatus {
        ACTIVE, INACTIVE, MAINTENANCE
    }

    // Constructors
    public Bus() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBusNumber() { return busNumber; }
    public void setBusNumber(String busNumber) { this.busNumber = busNumber; }

    public BusType getBusType() { return busType; }
    public void setBusType(BusType busType) { this.busType = busType; }

    public Integer getTotalSeats() { return totalSeats; }
    public void setTotalSeats(Integer totalSeats) { this.totalSeats = totalSeats; }

    public String getOperatorName() { return operatorName; }
    public void setOperatorName(String operatorName) { this.operatorName = operatorName; }

    public BusStatus getStatus() { return status; }
    public void setStatus(BusStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}