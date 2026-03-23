package com.smartfare.conductor.service;

import com.smartfare.conductor.model.BusStop;
import com.smartfare.conductor.model.ConductorTicket;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class ConductorService {
    
    @Autowired
    private FirebaseService firebaseService;
    
    @Autowired
    private QRCodeService qrCodeService;
    
    // Fare matrix same as frontend
    private final Map<String, Map<String, Map<String, BigDecimal>>> fareMatrix = new HashMap<>();
    
    public ConductorService() {
        initializeFareMatrix();
    }
    
    private void initializeFareMatrix() {
        Map<String, Map<String, BigDecimal>> koyambeduRoutes = new HashMap<>();
        koyambeduRoutes.put("Tambaram", Map.of(
            "ac_deluxe", new BigDecimal("45"),
            "ordinary", new BigDecimal("35"),
            "ac_express", new BigDecimal("40"),
            "volvo_ac", new BigDecimal("50")
        ));
        koyambeduRoutes.put("Velachery", Map.of(
            "ac_deluxe", new BigDecimal("35"),
            "ordinary", new BigDecimal("25"),
            "ac_express", new BigDecimal("30"),
            "volvo_ac", new BigDecimal("40")
        ));
        koyambeduRoutes.put("Broadway", Map.of(
            "ac_deluxe", new BigDecimal("25"),
            "ordinary", new BigDecimal("20"),
            "ac_express", new BigDecimal("22"),
            "volvo_ac", new BigDecimal("28")
        ));
        
        Map<String, Map<String, BigDecimal>> tambaramRoutes = new HashMap<>();
        tambaramRoutes.put("Koyambedu", Map.of(
            "ac_deluxe", new BigDecimal("45"),
            "ordinary", new BigDecimal("35"),
            "ac_express", new BigDecimal("40"),
            "volvo_ac", new BigDecimal("50")
        ));
        tambaramRoutes.put("Velachery", Map.of(
            "ac_deluxe", new BigDecimal("28"),
            "ordinary", new BigDecimal("25"),
            "ac_express", new BigDecimal("25"),
            "volvo_ac", new BigDecimal("30")
        ));
        tambaramRoutes.put("Broadway", Map.of(
            "ac_deluxe", new BigDecimal("40"),
            "ordinary", new BigDecimal("38"),
            "ac_express", new BigDecimal("38"),
            "volvo_ac", new BigDecimal("45")
        ));
        
        Map<String, Map<String, BigDecimal>> velacheryRoutes = new HashMap<>();
        velacheryRoutes.put("Koyambedu", Map.of(
            "ac_deluxe", new BigDecimal("35"),
            "ordinary", new BigDecimal("25"),
            "ac_express", new BigDecimal("30"),
            "volvo_ac", new BigDecimal("40")
        ));
        velacheryRoutes.put("Tambaram", Map.of(
            "ac_deluxe", new BigDecimal("28"),
            "ordinary", new BigDecimal("25"),
            "ac_express", new BigDecimal("25"),
            "volvo_ac", new BigDecimal("30")
        ));
        velacheryRoutes.put("Broadway", Map.of(
            "ac_deluxe", new BigDecimal("32"),
            "ordinary", new BigDecimal("28"),
            "ac_express", new BigDecimal("30"),
            "volvo_ac", new BigDecimal("35")
        ));
        
        Map<String, Map<String, BigDecimal>> broadwayRoutes = new HashMap<>();
        broadwayRoutes.put("Koyambedu", Map.of(
            "ac_deluxe", new BigDecimal("25"),
            "ordinary", new BigDecimal("20"),
            "ac_express", new BigDecimal("22"),
            "volvo_ac", new BigDecimal("28")
        ));
        broadwayRoutes.put("Tambaram", Map.of(
            "ac_deluxe", new BigDecimal("40"),
            "ordinary", new BigDecimal("38"),
            "ac_express", new BigDecimal("38"),
            "volvo_ac", new BigDecimal("45")
        ));
        broadwayRoutes.put("Velachery", Map.of(
            "ac_deluxe", new BigDecimal("32"),
            "ordinary", new BigDecimal("28"),
            "ac_express", new BigDecimal("30"),
            "volvo_ac", new BigDecimal("35")
        ));
        
        fareMatrix.put("Koyambedu", koyambeduRoutes);
        fareMatrix.put("Tambaram", tambaramRoutes);
        fareMatrix.put("Velachery", velacheryRoutes);
        fareMatrix.put("Broadway", broadwayRoutes);
    }
    
    public CompletableFuture<Map<String, Object>> validateQRTicket(Map<String, Object> ticketData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Validate ticket format
                if (!isValidTicketFormat(ticketData)) {
                    return Map.<String, Object>of(
                        "success", false,
                        "message", "Invalid ticket format"
                    );
                }
                
                // Extract ticket information
                String bookingId = (String) ticketData.get("bookingId");
                String source = (String) ticketData.get("source");
                String destination = (String) ticketData.get("destination");
                
                // Find the relevant bus stop to update
                // For simplicity, we'll update the destination stop
                String stopId = findStopIdByDestination(destination);
                
                if (stopId == null) {
                    return Map.<String, Object>of(
                        "success", false,
                        "message", "Destination stop not found"
                    );
                }
                
                // Update Firebase if available
                if (firebaseService.isFirebaseAvailable()) {
                    return firebaseService.getBusStop(stopId)
                        .thenCompose(busStop -> {
                            if (busStop != null) {
                                // Increment ticket distribution
                                busStop.incrementTicketDistribution();
                                
                                // Update Firebase
                                return firebaseService.updateBusStop(stopId, busStop)
                                    .thenApply(result -> Map.<String, Object>of(
                                        "success", true,
                                        "message", "Ticket validated successfully",
                                        "bookingId", bookingId,
                                        "updatedStop", stopId,
                                        "newTicketCount", busStop.getTicketDistribution(),
                                        "checkedStatus", busStop.getCheckedStatus()
                                    ));
                            } else {
                                // Create new bus stop if not exists
                                BusStop newStop = new BusStop(destination, 1, 1, "checked");
                                return firebaseService.updateBusStop(stopId, newStop)
                                    .thenApply(result -> Map.<String, Object>of(
                                        "success", true,
                                        "message", "Ticket validated and new stop created",
                                        "bookingId", bookingId,
                                        "updatedStop", stopId,
                                        "newTicketCount", 1,
                                        "checkedStatus", "checked"
                                    ));
                            }
                        })
                        .exceptionally(throwable -> Map.<String, Object>of(
                            "success", false,
                            "message", "Error updating Firebase: " + throwable.getMessage()
                        ))
                        .get();
                } else {
                    // Fallback when Firebase is not available
                    return Map.<String, Object>of(
                        "success", true,
                        "message", "Ticket validated (Firebase not available)",
                        "bookingId", bookingId,
                        "note", "Firebase not configured - validation logged only"
                    );
                }
                
            } catch (Exception e) {
                return Map.<String, Object>of(
                    "success", false,
                    "message", "Error validating ticket: " + e.getMessage()
                );
            }
        });
    }
    
    public CompletableFuture<Map<String, Object>> issueManualTicket(Map<String, Object> ticketRequest) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Extract ticket information
                String sourceStop = (String) ticketRequest.get("sourceStop");
                String destStop = (String) ticketRequest.get("destStop");
                String busType = (String) ticketRequest.get("busType");
                String passengerName = (String) ticketRequest.get("passengerName");
                String busNumber = (String) ticketRequest.get("busNumber");
                
                // Validate inputs
                if (sourceStop == null || destStop == null || busType == null || passengerName == null) {
                    return Map.of(
                        "success", false,
                        "message", "Missing required fields"
                    );
                }
                
                if (sourceStop.equals(destStop)) {
                    return Map.of(
                        "success", false,
                        "message", "Source and destination cannot be the same"
                    );
                }
                
                // Calculate fare
                BigDecimal fare = calculateFare(sourceStop, destStop, busType);
                if (fare.equals(BigDecimal.ZERO)) {
                    return Map.of(
                        "success", false,
                        "message", "Invalid route or bus type"
                    );
                }
                
                // Create ticket
                ConductorTicket ticket = new ConductorTicket(
                    passengerName, sourceStop, destStop, busNumber, busType, fare
                );
                
                // Generate QR code
                String qrCodeBase64 = qrCodeService.generateQRCodeBase64(ticket.getQrData());
                ticket.setQrCode(qrCodeBase64);
                
                // Update Firebase if available
                if (firebaseService.isFirebaseAvailable()) {
                    String stopId = findStopIdByDestination(destStop);
                    
                    if (stopId != null) {
                        return firebaseService.getBusStop(stopId)
                            .thenCompose(busStop -> {
                                if (busStop != null) {
                                    // Increment ticket distribution
                                    busStop.incrementTicketDistribution();
                                    
                                    // Update Firebase
                                    return firebaseService.updateBusStop(stopId, busStop)
                                        .thenApply(result -> Map.of(
                                            "success", true,
                                            "message", "Ticket issued successfully",
                                            "ticket", ticket,
                                            "updatedStop", stopId,
                                            "newTicketCount", busStop.getTicketDistribution(),
                                            "checkedStatus", busStop.getCheckedStatus()
                                        ));
                                } else {
                                    // Create new bus stop
                                    BusStop newStop = new BusStop(destStop, 0, 1, "unchecked");
                                    return firebaseService.updateBusStop(stopId, newStop)
                                        .thenApply(result -> Map.of(
                                            "success", true,
                                            "message", "Ticket issued and new stop created",
                                            "ticket", ticket,
                                            "updatedStop", stopId,
                                            "newTicketCount", 1,
                                            "checkedStatus", "unchecked"
                                        ));
                                }
                            })
                            .exceptionally(throwable -> Map.of(
                                "success", false,
                                "message", "Error updating Firebase: " + throwable.getMessage()
                            ))
                            .get();
                    }
                }
                
                // Return ticket without Firebase update
                return Map.of(
                    "success", true,
                    "message", "Ticket issued successfully",
                    "ticket", ticket,
                    "note", "Firebase not configured - ticket issued locally"
                );
                
            } catch (Exception e) {
                return Map.of(
                    "success", false,
                    "message", "Error issuing ticket: " + e.getMessage()
                );
            }
        });
    }
    
    public CompletableFuture<Map<String, Object>> getAllBusStops() {
        if (!firebaseService.isFirebaseAvailable()) {
            return CompletableFuture.completedFuture(Map.of(
                "success", false,
                "message", "Firebase not available",
                "data", List.of()
            ));
        }
        
        return firebaseService.getAllBusStops()
            .thenApply(stops -> Map.of(
                "success", true,
                "message", "Bus stops retrieved successfully",
                "data", stops.values()
            ))
            .exceptionally(throwable -> Map.of(
                "success", false,
                "message", "Error retrieving bus stops: " + throwable.getMessage(),
                "data", List.of()
            ));
    }
    
    private boolean isValidTicketFormat(Map<String, Object> ticketData) {
        return ticketData.containsKey("bookingId") && 
               ticketData.containsKey("source") && 
               ticketData.containsKey("destination") &&
               ticketData.containsKey("busNumber");
    }
    
    private String findStopIdByDestination(String destination) {
        // Simple mapping - in real app, this would be more sophisticated
        Map<String, String> stopMapping = Map.of(
            "Koyambedu", "stop_koyambedu",
            "Tambaram", "stop_tambaram",
            "Velachery", "stop_velachery",
            "Broadway", "stop_broadway",
            "Poonamallee", "stop_poonamallee",
            "Porur", "stop_porur"
        );
        
        return stopMapping.get(destination);
    }
    
    private BigDecimal calculateFare(String source, String destination, String busType) {
        Map<String, Map<String, BigDecimal>> sourceRoutes = fareMatrix.get(source);
        if (sourceRoutes != null) {
            Map<String, BigDecimal> destFares = sourceRoutes.get(destination);
            if (destFares != null) {
                BigDecimal fare = destFares.get(busType);
                return fare != null ? fare : BigDecimal.ZERO;
            }
        }
        return BigDecimal.ZERO;
    }
}
