-- Insert bus schedules for today and next few days
USE smart_fare_db;

-- Insert bus schedules for today and next few days
INSERT INTO bus_schedules (bus_id, route_id, departure_time, arrival_time, fare, available_seats, schedule_date) VALUES
-- Koyambedu to Tambaram route (Route ID: 1)
(1, 1, '06:00:00', '06:45:00', 45.00, 35, CURDATE()),
(2, 1, '08:30:00', '09:15:00', 35.00, 45, CURDATE()),
(3, 1, '14:00:00', '14:45:00', 40.00, 40, CURDATE()),
(4, 1, '20:00:00', '20:45:00', 50.00, 30, CURDATE()),

-- Koyambedu to Velachery route (Route ID: 2)
(1, 2, '07:00:00', '07:35:00', 35.00, 38, CURDATE()),
(3, 2, '15:30:00', '16:05:00', 30.00, 42, CURDATE()),

-- Broadway to Tambaram route (Route ID: 3)
(2, 3, '09:00:00', '09:50:00', 40.00, 48, CURDATE()),
(4, 3, '21:30:00', '22:20:00', 45.00, 32, CURDATE()),

-- Broadway to Velachery route (Route ID: 4)
(1, 4, '10:00:00', '10:40:00', 35.00, 36, CURDATE()),
(4, 4, '18:30:00', '19:10:00', 40.00, 28, CURDATE()),

-- Tomorrow's schedules
(1, 1, '06:00:00', '06:45:00', 45.00, 40, DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
(2, 1, '08:30:00', '09:15:00', 35.00, 50, DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
(3, 1, '14:00:00', '14:45:00', 40.00, 45, DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
(4, 1, '20:00:00', '20:45:00', 50.00, 35, DATE_ADD(CURDATE(), INTERVAL 1 DAY)),

-- Day after tomorrow's schedules
(1, 1, '06:00:00', '06:45:00', 45.00, 40, DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
(2, 1, '08:30:00', '09:15:00', 35.00, 50, DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
(3, 1, '14:00:00', '14:45:00', 40.00, 45, DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
(4, 1, '20:00:00', '20:45:00', 50.00, 35, DATE_ADD(CURDATE(), INTERVAL 2 DAY));

-- Verify the data
SELECT 
    bs.id,
    b.bus_number,
    bt.type_name,
    b.operator_name,
    fl.name as from_location,
    tl.name as to_location,
    bs.departure_time,
    bs.arrival_time,
    bs.fare,
    bs.available_seats,
    bs.schedule_date
FROM bus_schedules bs
JOIN buses b ON bs.bus_id = b.id
JOIN bus_types bt ON b.bus_type_id = bt.id
JOIN routes r ON bs.route_id = r.id
JOIN locations fl ON r.from_location_id = fl.id
JOIN locations tl ON r.to_location_id = tl.id
ORDER BY bs.schedule_date, bs.departure_time;