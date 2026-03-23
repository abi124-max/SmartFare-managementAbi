package com.smartfare.conductor.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.math.BigDecimal;

public class ConductorTicket {
    
    private String bookingId;
    
    @JsonProperty("passenger_name")
    private String passengerName;
    
    @JsonProperty("source_stop")
    private String sourceStop;
    
    @JsonProperty("dest_stop")
    private String destStop;
    
    @JsonProperty("bus_number")
    private String busNumber;
    
    @JsonProperty("bus_type")
    private String busType;
    
    private BigDecimal fare;
    
    private LocalDateTime timestamp;
    
    private String qrCode;
    
    @JsonProperty("qr_data")
    private String qrData;
    
    private String status;
    
    public ConductorTicket() {}
    
    public ConductorTicket(String passengerName, String sourceStop, String destStop, 
                          String busNumber, String busType, BigDecimal fare) {
        this.bookingId = generateBookingId();
        this.passengerName = passengerName;
        this.sourceStop = sourceStop;
        this.destStop = destStop;
        this.busNumber = busNumber;
        this.busType = busType;
        this.fare = fare;
        this.timestamp = LocalDateTime.now();
        this.status = "ACTIVE";
        this.qrData = generateQRData();
    }
    
    // Getters and Setters
    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }
    
    public String getPassengerName() { return passengerName; }
    public void setPassengerName(String passengerName) { this.passengerName = passengerName; }
    
    public String getSourceStop() { return sourceStop; }
    public void setSourceStop(String sourceStop) { this.sourceStop = sourceStop; }
    
    public String getDestStop() { return destStop; }
    public void setDestStop(String destStop) { this.destStop = destStop; }
    
    public String getBusNumber() { return busNumber; }
    public void setBusNumber(String busNumber) { this.busNumber = busNumber; }
    
    public String getBusType() { return busType; }
    public void setBusType(String busType) { this.busType = busType; }
    
    public BigDecimal getFare() { return fare; }
    public void setFare(BigDecimal fare) { this.fare = fare; }
    
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    
    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }
    
    public String getQrData() { return qrData; }
    public void setQrData(String qrData) { this.qrData = qrData; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    private String generateBookingId() {
        return "CD" + System.currentTimeMillis();
    }
    
    private String generateQRData() {
        return String.format(
            "{\"bookingId\":\"%s\",\"passenger\":\"%s\",\"source\":\"%s\",\"destination\":\"%s\",\"bus\":\"%s\",\"fare\":\"%s\",\"date\":\"%s\",\"time\":\"%s\"}",
            bookingId, passengerName, sourceStop, destStop, busNumber, 
            fare.toString(), timestamp.toLocalDate(), timestamp.toLocalTime()
        );
    }
}
