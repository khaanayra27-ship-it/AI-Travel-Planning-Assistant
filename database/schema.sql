-- Database Schema for AI Travel Planning Assistant

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trips Table
CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    destination TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    budget_limit REAL NOT NULL,
    travel_style TEXT NOT NULL,
    companion_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Itineraries Table (Day-by-Day schedule)
CREATE TABLE IF NOT EXISTS itineraries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    day_number INTEGER NOT NULL,
    morning_act TEXT NOT NULL,
    afternoon_act TEXT NOT NULL,
    evening_act TEXT NOT NULL,
    transport_info TEXT,
    notes TEXT,
    FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    category TEXT NOT NULL, -- 'Accommodation', 'Food', 'Transport', 'Activities', 'Miscellaneous'
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- Hotels Table (AI Suggested hotels)
CREATE TABLE IF NOT EXISTS hotels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    rating REAL,
    price_level TEXT, -- 'Budget', 'Mid-range', 'Luxury'
    description TEXT,
    FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- Packing Checklist Table
CREATE TABLE IF NOT EXISTS packing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Clothing', 'Documents', 'Electronics', 'Toiletries', 'Other'
    packed INTEGER DEFAULT 0, -- 0 for false, 1 for true
    FOREIGN KEY(trip_id) REFERENCES trips(id) ON DELETE CASCADE
);
