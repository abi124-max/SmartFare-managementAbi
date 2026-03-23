package com.smartfare.conductor.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.smartfare.conductor.model.BusStop;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class FirebaseService {
    
    @Value("${firebase.database.url}")
    private String databaseUrl;
    
    @Value("${firebase.project.id}")
    private String projectId;
    
    private FirebaseDatabase firebaseDatabase;
    private DatabaseReference busStopsRef;
    
    @PostConstruct
    public void initializeFirebase() {
        try {
            // Initialize Firebase if not already initialized
            if (FirebaseApp.getApps().isEmpty()) {
                // In production, use service account credentials
                // For development, this might work with emulator
                FirebaseApp.initializeApp();
            }
            
            firebaseDatabase = FirebaseDatabase.getInstance(databaseUrl);
            busStopsRef = firebaseDatabase.getReference("bus_stops");
            
            System.out.println("🔥 Firebase initialized successfully");
            
        } catch (Exception e) {
            System.err.println("❌ Firebase initialization failed: " + e.getMessage());
            // For development, continue without Firebase
            e.printStackTrace();
        }
    }
    
    public CompletableFuture<Void> updateBusStop(String stopId, BusStop busStop) {
        CompletableFuture<Void> future = new CompletableFuture<>();
        
        if (busStopsRef == null) {
            future.completeExceptionally(new RuntimeException("Firebase not initialized"));
            return future;
        }
        
        busStopsRef.child(stopId).setValue(busStop, (error, ref) -> {
            if (error != null) {
                future.completeExceptionally(error.toException());
            } else {
                future.complete(null);
            }
        });
        
        return future;
    }
    
    public CompletableFuture<BusStop> getBusStop(String stopId) {
        CompletableFuture<BusStop> future = new CompletableFuture<>();
        
        if (busStopsRef == null) {
            future.completeExceptionally(new RuntimeException("Firebase not initialized"));
            return future;
        }
        
        busStopsRef.child(stopId).addListenerForSingleValueEvent(new com.google.firebase.database.ValueEventListener() {
            @Override
            public void onDataChange(com.google.firebase.database.DataSnapshot snapshot) {
                BusStop busStop = snapshot.getValue(BusStop.class);
                if (busStop != null) {
                    busStop.setId(snapshot.getKey());
                }
                future.complete(busStop);
            }
            
            @Override
            public void onCancelled(com.google.firebase.database.DatabaseError error) {
                future.completeExceptionally(error.toException());
            }
        });
        
        return future;
    }
    
    public CompletableFuture<Map<String, BusStop>> getAllBusStops() {
        CompletableFuture<Map<String, BusStop>> future = new CompletableFuture<>();
        
        if (busStopsRef == null) {
            future.completeExceptionally(new RuntimeException("Firebase not initialized"));
            return future;
        }
        
        busStopsRef.addListenerForSingleValueEvent(new com.google.firebase.database.ValueEventListener() {
            @Override
            public void onDataChange(com.google.firebase.database.DataSnapshot snapshot) {
                Map<String, BusStop> stops = new java.util.HashMap<>();
                
                for (com.google.firebase.database.DataSnapshot childSnapshot : snapshot.getChildren()) {
                    BusStop busStop = childSnapshot.getValue(BusStop.class);
                    if (busStop != null) {
                        busStop.setId(childSnapshot.getKey());
                        stops.put(childSnapshot.getKey(), busStop);
                    }
                }
                
                future.complete(stops);
            }
            
            @Override
            public void onCancelled(com.google.firebase.database.DatabaseError error) {
                future.completeExceptionally(error.toException());
            }
        });
        
        return future;
    }
    
    public void addBusStopListener(ValueEventListener listener) {
        if (busStopsRef != null) {
            busStopsRef.addValueEventListener(listener);
        }
    }
    
    public void removeBusStopListener(ValueEventListener listener) {
        if (busStopsRef != null) {
            busStopsRef.removeEventListener(listener);
        }
    }
    
    public boolean isFirebaseAvailable() {
        return busStopsRef != null;
    }
}
