package com.smartfare.repository;

import com.smartfare.model.Passenger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PassengerRepository extends JpaRepository<Passenger, Long> {
    
    Optional<Passenger> findByPhone(String phone);
    
    Optional<Passenger> findByEmail(String email);
}