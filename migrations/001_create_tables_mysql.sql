-- RailMate Database Schema for MySQL 8
-- Component 9 - Database Design

CREATE DATABASE IF NOT EXISTS railmate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE railmate;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    phone VARCHAR(50) NULL,
    preferences JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- 2. Stations Table
CREATE TABLE IF NOT EXISTS stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DOUBLE NULL,
    longitude DOUBLE NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_stations_code (code),
    INDEX idx_stations_city (city)
) ENGINE=InnoDB;

-- 3. Trains Table
CREATE TABLE IF NOT EXISTS trains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    train_number VARCHAR(50) NOT NULL UNIQUE,
    train_name VARCHAR(255) NOT NULL,
    train_type VARCHAR(50) NOT NULL DEFAULT 'Express',
    provider_mode VARCHAR(50) NOT NULL DEFAULT 'DEMO',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_trains_number (train_number)
) ENGINE=InnoDB;

-- 4. Train Schedules Table
CREATE TABLE IF NOT EXISTS train_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    train_id INT NOT NULL,
    from_station_id INT NOT NULL,
    to_station_id INT NOT NULL,
    departure_time VARCHAR(10) NOT NULL,
    arrival_time VARCHAR(10) NOT NULL,
    duration_minutes INT NOT NULL,
    days VARCHAR(50) NOT NULL DEFAULT 'Daily',
    fare_inr DOUBLE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_schedules_stations (from_station_id, to_station_id),
    CONSTRAINT fk_schedules_train FOREIGN KEY (train_id) REFERENCES trains(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedules_from FOREIGN KEY (from_station_id) REFERENCES stations(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedules_to FOREIGN KEY (to_station_id) REFERENCES stations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_ref VARCHAR(100) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    travel_date DATE NOT NULL,
    train_name VARCHAR(255) NOT NULL,
    train_number VARCHAR(100) NOT NULL,
    departure_time VARCHAR(10) NOT NULL,
    arrival_time VARCHAR(10) NOT NULL,
    duration_minutes INT NOT NULL,
    transfers INT NOT NULL DEFAULT 0,
    fare_inr DOUBLE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
    provider_mode VARCHAR(50) NOT NULL DEFAULT 'DEMO',
    passengers JSON NOT NULL,
    status_history JSON NOT NULL,
    idempotency_key VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bookings_user_date (user_id, travel_date),
    INDEX idx_bookings_ref (booking_ref),
    INDEX idx_bookings_idempotency (idempotency_key),
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    kind VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notifications_user (user_id, created_at),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Route Searches Table
CREATE TABLE IF NOT EXISTS route_searches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    travel_date DATE NULL,
    preferences JSON NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'DEMO',
    result_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_searches_user (user_id)
) ENGINE=InnoDB;

-- 8. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    session_id VARCHAR(100) NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'RailMate travel search',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_conversations_user (user_id)
) ENGINE=InnoDB;

-- 9. Conversation Messages Table
CREATE TABLE IF NOT EXISTS conversation_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    metadata_json JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conv_messages_conv (conversation_id),
    CONSTRAINT fk_messages_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Agent Execution Logs Table
CREATE TABLE IF NOT EXISTS agent_execution_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    execution_time_ms INT NOT NULL DEFAULT 0,
    detail JSON NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_agent_logs_name (agent_name),
    INDEX idx_agent_logs_status (status)
) ENGINE=InnoDB;

-- 11. External Provider Events Table
CREATE TABLE IF NOT EXISTS external_provider_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_name VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSON NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'processed',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_provider_events_name (provider_name)
) ENGINE=InnoDB;

-- 12. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NULL,
    detail JSON NOT NULL,
    ip_address VARCHAR(50) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_logs_user_action (user_id, action)
) ENGINE=InnoDB;

-- 13. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    booking_ref VARCHAR(100) NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tickets_user (user_id)
) ENGINE=InnoDB;
