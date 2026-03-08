package com.smartfare.repository;

import com.smartfare.model.BusType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusTypeRepository extends JpaRepository<BusType, Long> {
}