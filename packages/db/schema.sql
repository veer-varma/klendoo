-- Copyright (c) 2026 Veer Varma. All rights reserved.

-- Users/Hosts table
CREATE TABLE IF NOT EXISTS hosts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  wallet_address VARCHAR(58) UNIQUE,
  google_oauth_token TEXT,
  name VARCHAR(255),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  host_id INTEGER NOT NULL REFERENCES hosts(id),
  visitor_email VARCHAR(255) NOT NULL,
  visitor_name VARCHAR(255) NOT NULL,
  session_type VARCHAR(100),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed',
  calendar_event_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES hosts(id)
);

-- Settlements table
CREATE TABLE IF NOT EXISTS settlements (
  id SERIAL PRIMARY KEY,
  host_id INTEGER NOT NULL REFERENCES hosts(id),
  booking_id INTEGER REFERENCES bookings(id),
  action_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 6) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  transaction_hash VARCHAR(255),
  confirmation_time INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES hosts(id)
);

-- Session metadata table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  host_id INTEGER NOT NULL REFERENCES hosts(id),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES hosts(id)
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  host_id INTEGER REFERENCES hosts(id),
  booking_id INTEGER REFERENCES bookings(id),
  settlement_id INTEGER REFERENCES settlements(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_bookings_host_id ON bookings(host_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_settlements_host_id ON settlements(host_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_transaction_hash ON settlements(transaction_hash);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
