package com.smartfare.conductor.controller;

import com.smartfare.conductor.service.ConductorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/conductor")
@CrossOrigin(origins = "*")
public class ConductorController {
    
    @Autowired
    private ConductorService conductorService;
    
    @PostMapping("/validate-ticket")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> validateTicket(@RequestBody Map<String, Object> ticketData) {
        return conductorService.validateQRTicket(ticketData)
            .thenApply(result -> {
                if ((Boolean) result.get("success")) {
                    return ResponseEntity.ok(result);
                } else {
                    return ResponseEntity.badRequest().body(result);
                }
            })
            .exceptionally(throwable -> {
                return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Internal server error: " + throwable.getMessage()
                ));
            });
    }
    
    @PostMapping("/issue-ticket")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> issueTicket(@RequestBody Map<String, Object> ticketRequest) {
        return conductorService.issueManualTicket(ticketRequest)
            .thenApply(result -> {
                if ((Boolean) result.get("success")) {
                    return ResponseEntity.ok(result);
                } else {
                    return ResponseEntity.badRequest().body(result);
                }
            })
            .exceptionally(throwable -> {
                return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Internal server error: " + throwable.getMessage()
                ));
            });
    }
    
    @GetMapping("/bus-stops")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getBusStops() {
        return conductorService.getAllBusStops()
            .thenApply(ResponseEntity::ok)
            .exceptionally(throwable -> {
                return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Error retrieving bus stops: " + throwable.getMessage()
                ));
            });
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "service", "Smart Fare Conductor Backend",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
