package com.smartfare.repository;

import com.smartfare.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {
    
    List<Location> findByCity(String city);
    
    List<Location> findByState(String state);
    
    @Query("SELECT l FROM Location l WHERE l.name LIKE %?1% OR l.city LIKE %?1%")
    List<Location> findByNameOrCityContaining(String searchTerm);
}