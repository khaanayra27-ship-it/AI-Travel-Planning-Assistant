const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'travel_planner.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// Create or open the SQLite database
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema if tables don't exist
try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('Database initialized successfully.');
} catch (err) {
    console.error('Error initializing database schema:', err);
}

module.exports = db;
