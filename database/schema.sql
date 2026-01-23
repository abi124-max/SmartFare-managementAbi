-- Smart Fare Management System Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS smart_fare_db;
USE smart_fare_db;

-- Locations table
CREATE TABLE locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bus types table
CREATE TABLE bus_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL, -- AC, Non-AC, Sleeper, etc.
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buses table
CREATE TABLE buses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    bus_type_id INT,
    total_seats INT NOT NULL,
    operator_name VARCHAR(100) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_type_id) REFERENCES bus_types(id)
);

-- Routes table
CREATE TABLE routes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_location_id INT NOT NULL,
    to_location_id INT NOT NULL,
    distance_km DECIMAL(6, 2),
    estimated_duration_minutes INT,
    base_fare DECIMAL(8, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_location_id) REFERENCES locations(id),
    FOREIGN KEY (to_location_id) REFERENCES locations(id),
    UNIQUE KEY unique_route (from_location_id, to_location_id)
);

-- Bus schedules table
CREATE TABLE bus_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bus_id INT NOT NULL,
    route_id INT NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    fare DECIMAL(8, 2) NOT NULL,
    available_seats INT NOT NULL,
    schedule_date DATE NOT NULL,
    status ENUM('SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id),
    FOREIGN KEY (route_id) REFERENCES routes(id)
);

-- Passengers table
CREATE TABLE passengers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    passenger_id INT NOT NULL,
    schedule_id INT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    fare_amount DECIMAL(8, 2) NOT NULL,
    payment_status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    payment_method VARCHAR(20) DEFAULT 'UPI',
    payment_transaction_id VARCHAR(100),
    qr_code_data TEXT,
    booking_status ENUM('CONFIRMED', 'CANCELLED', 'COMPLETED') DEFAULT 'CONFIRMED',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (passenger_id) REFERENCES passengers(id),
    FOREIGN KEY (schedule_id) REFERENCES bus_schedules(id)
);

-- Insert sample data
INSERT INTO locations (name, city, state, latitude, longitude) VALUES
('Koyambedu Bus Terminal', 'Chennai', 'Tamil Nadu', 13.0732, 80.1986),
('Tambaram Bus Stand', 'Chennai', 'Tamil Nadu', 12.9249, 80.1000),
('Velachery Bus Depot', 'Chennai', 'Tamil Nadu', 12.9759, 80.2207),
('Broadway Bus Terminal', 'Chennai', 'Tamil Nadu', 13.0878, 80.2785);

INSERT INTO bus_types (type_name, description) VALUES
('AC Deluxe', 'Air conditioned deluxe bus with comfortable seating'),
('Ordinary', 'Regular city bus service'),
('AC Express', 'Air conditioned express bus service'),
('Volvo AC', 'Premium Volvo bus with luxury amenities');

INSERT INTO buses (bus_number, bus_type_id, total_seats, operator_name) VALUES
('TN09N2345', 1, 40, 'MTC Chennai'),
('TN09P4567', 2, 50, 'TNSTC'),
('TN09Q7890', 3, 45, 'Parveen Travels'),
('TN09R1234', 4, 35, 'KPN Travels');

INSERT INTO routes (from_location_id, to_location_id, distance_km, estimated_duration_minutes, base_fare) VALUES
(1, 2, 25.5, 45, 35.00),
(1, 3, 18.2, 35, 25.00),
(4, 2, 30.8, 50, 40.00),
(4, 3, 22.5, 40, 30.00);