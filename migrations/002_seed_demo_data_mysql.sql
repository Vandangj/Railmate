-- RailMate Seed Data for MySQL 8
USE railmate;

-- Insert Stations
INSERT INTO stations (code, name, city, latitude, longitude) VALUES
('CSMT', 'Chhatrapati Shivaji Maharaj Terminus', 'Mumbai', 18.9398, 72.8355),
('BCT', 'Mumbai Central', 'Mumbai', 18.9696, 72.8193),
('JP', 'Jaipur Junction', 'Jaipur', 26.9196, 75.7878),
('NDLS', 'New Delhi Railway Station', 'Delhi', 28.6431, 77.2197),
('ADI', 'Ahmedabad Junction', 'Ahmedabad', 23.0225, 72.5714),
('BRC', 'Vadodara Junction', 'Vadodara', 22.3107, 73.1812),
('ST', 'Surat Railway Station', 'Surat', 21.1702, 72.8311),
('PUNE', 'Pune Junction', 'Pune', 18.5289, 73.8744),
('KOTA', 'Kota Junction', 'Kota', 25.2138, 75.8648),
('AGC', 'Agra Cantt', 'Agra', 27.1574, 78.0068),
('CNB', 'Kanpur Central', 'Kanpur', 26.4547, 80.3507),
('BSB', 'Varanasi Junction', 'Varanasi', 25.3268, 82.9877),
('HWH', 'Howrah Junction', 'Kolkata', 22.5840, 88.3426),
('SBC', 'KSR Bengaluru City Junction', 'Bengaluru', 12.9781, 77.5696),
('MAS', 'Chennai Central', 'Chennai', 13.0827, 80.2707),
('GOI', 'Madgaon Junction', 'Goa', 15.2736, 73.9580)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Trains
INSERT INTO trains (train_number, train_name, train_type, provider_mode) VALUES
('RM101', 'Western Demo Express', 'Superfast', 'DEMO'),
('RM205', 'Desert Link Demo', 'Express', 'DEMO'),
('RM310', 'Capital Connector Demo', 'Superfast', 'DEMO'),
('RM420', 'Gujarat Intercity Demo', 'Intercity', 'DEMO'),
('RM501', 'Deccan Demo Express', 'Express', 'DEMO'),
('RM602', 'Pink City Vande Demo', 'Vande Bharat', 'DEMO'),
('RM704', 'Taj Capital Express', 'Gatimaan', 'DEMO'),
('RM808', 'Ganga Express Demo', 'Superfast', 'DEMO'),
('RM915', 'Konkan Coastal Link', 'Superfast', 'DEMO'),
('RM950', 'Southern Highspeed Demo', 'Shatabdi', 'DEMO')
ON DUPLICATE KEY UPDATE train_name=VALUES(train_name);

-- Insert Schedules
-- Mumbai to Ahmedabad (RM101)
INSERT INTO train_schedules (train_id, from_station_id, to_station_id, departure_time, arrival_time, duration_minutes, days, fare_inr)
SELECT t.id, s1.id, s2.id, '06:10', '17:40', 690, 'Daily', 890.00
FROM trains t, stations s1, stations s2
WHERE t.train_number = 'RM101' AND s1.code = 'CSMT' AND s2.code = 'ADI';

-- Ahmedabad to Jaipur (RM205)
INSERT INTO train_schedules (train_id, from_station_id, to_station_id, departure_time, arrival_time, duration_minutes, days, fare_inr)
SELECT t.id, s1.id, s2.id, '19:25', '05:50', 625, 'Daily', 1050.00
FROM trains t, stations s1, stations s2
WHERE t.train_number = 'RM205' AND s1.code = 'ADI' AND s2.code = 'JP';

-- Direct Mumbai to Jaipur (RM310)
INSERT INTO train_schedules (train_id, from_station_id, to_station_id, departure_time, arrival_time, duration_minutes, days, fare_inr)
SELECT t.id, s1.id, s2.id, '15:00', '04:50', 830, 'Daily', 1250.00
FROM trains t, stations s1, stations s2
WHERE t.train_number = 'RM310' AND s1.code = 'CSMT' AND s2.code = 'JP';

-- Ahmedabad to Vadodara (RM420)
INSERT INTO train_schedules (train_id, from_station_id, to_station_id, departure_time, arrival_time, duration_minutes, days, fare_inr)
SELECT t.id, s1.id, s2.id, '07:30', '09:10', 100, 'Daily', 350.00
FROM trains t, stations s1, stations s2
WHERE t.train_number = 'RM420' AND s1.code = 'ADI' AND s2.code = 'BRC';

-- Mumbai to Pune (RM501)
INSERT INTO train_schedules (train_id, from_station_id, to_station_id, departure_time, arrival_time, duration_minutes, days, fare_inr)
SELECT t.id, s1.id, s2.id, '11:30', '15:00', 210, 'Daily', 450.00
FROM trains t, stations s1, stations s2
WHERE t.train_number = 'RM501' AND s1.code = 'CSMT' AND s2.code = 'PUNE';

-- Delhi to Jaipur (RM602)
INSERT INTO train_schedules (train_id, from_station_id, to_station_id, departure_time, arrival_time, duration_minutes, days, fare_inr)
SELECT t.id, s1.id, s2.id, '06:10', '10:35', 265, 'Daily', 820.00
FROM trains t, stations s1, stations s2
WHERE t.train_number = 'RM602' AND s1.code = 'NDLS' AND s2.code = 'JP';

-- Delhi to Agra (RM704)
INSERT INTO train_schedules (train_id, from_station_id, to_station_id, departure_time, arrival_time, duration_minutes, days, fare_inr)
SELECT t.id, s1.id, s2.id, '08:10', '09:50', 100, 'Daily', 450.00
FROM trains t, stations s1, stations s2
WHERE t.train_number = 'RM704' AND s1.code = 'NDLS' AND s2.code = 'AGC';

-- Delhi to Varanasi (RM808)
INSERT INTO train_schedules (train_id, from_station_id, to_station_id, departure_time, arrival_time, duration_minutes, days, fare_inr)
SELECT t.id, s1.id, s2.id, '06:00', '14:15', 495, 'Daily', 1180.00
FROM trains t, stations s1, stations s2
WHERE t.train_number = 'RM808' AND s1.code = 'NDLS' AND s2.code = 'BSB';

-- Mumbai to Goa (RM915)
INSERT INTO train_schedules (train_id, from_station_id, to_station_id, departure_time, arrival_time, duration_minutes, days, fare_inr)
SELECT t.id, s1.id, s2.id, '05:25', '16:15', 650, 'Daily', 950.00
FROM trains t, stations s1, stations s2
WHERE t.train_number = 'RM915' AND s1.code = 'CSMT' AND s2.code = 'GOI';

-- Bengaluru to Chennai (RM950)
INSERT INTO train_schedules (train_id, from_station_id, to_station_id, departure_time, arrival_time, duration_minutes, days, fare_inr)
SELECT t.id, s1.id, s2.id, '06:00', '10:45', 285, 'Daily', 690.00
FROM trains t, stations s1, stations s2
WHERE t.train_number = 'RM950' AND s1.code = 'SBC' AND s2.code = 'MAS';
