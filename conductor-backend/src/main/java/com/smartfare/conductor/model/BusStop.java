package com.smartfare.conductor.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public class BusStop {
    
    private String id;
    
    @JsonProperty("stopping_name")
    private String stoppingName;
    
    @JsonProperty("headcount")
    private Integer headcount;
    
    @JsonProperty("ticket_distribution")
    private Integer ticketDistribution;
    
    @JsonProperty("checked_status")
    private String checkedStatus;
    
    private LocalDateTime lastUpdated;
    
    public BusStop() {}
    
    public BusStop(String stoppingName, Integer headcount, Integer ticketDistribution, String checkedStatus) {
        this.stoppingName = stoppingName;
        this.headcount = headcount;
        this.ticketDistribution = ticketDistribution;
        this.checkedStatus = checkedStatus;
        this.lastUpdated = LocalDateTime.now();
    }
    
    public BusStop(String id, String stoppingName, Integer headcount, Integer ticketDistribution, String checkedStatus, LocalDateTime lastUpdated) {
        this.id = id;
        this.stoppingName = stoppingName;
        this.headcount = headcount;
        this.ticketDistribution = ticketDistribution;
        this.checkedStatus = checkedStatus;
        this.lastUpdated = lastUpdated;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getStoppingName() { return stoppingName; }
    public void setStoppingName(String stoppingName) { this.stoppingName = stoppingName; }
    
    public Integer getHeadcount() { return headcount; }
    public void setHeadcount(Integer headcount) { this.headcount = headcount; }
    
    public Integer getTicketDistribution() { return ticketDistribution; }
    public void setTicketDistribution(Integer ticketDistribution) { this.ticketDistribution = ticketDistribution; }
    
    public String getCheckedStatus() { return checkedStatus; }
    public void setCheckedStatus(String checkedStatus) { this.checkedStatus = checkedStatus; }
    
    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
    
    public void incrementTicketDistribution() {
        this.ticketDistribution = (this.ticketDistribution != null ? this.ticketDistribution : 0) + 1;
        this.lastUpdated = LocalDateTime.now();
        updateCheckedStatus();
    }
    
    public void updateCheckedStatus() {
        if (headcount != null && ticketDistribution != null) {
            this.checkedStatus = headcount.equals(ticketDistribution) ? "checked" : "unchecked";
        }
    }
    
    public Integer getDiscrepancy() {
        if (headcount != null && ticketDistribution != null) {
            return Math.abs(headcount - ticketDistribution);
        }
        return 0;
    }
}
