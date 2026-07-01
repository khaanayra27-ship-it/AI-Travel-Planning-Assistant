const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken } = require('./auth');

// Get all trips for the current user
router.get('/', authenticateToken, (req, res) => {
    try {
        const trips = db.prepare('SELECT * FROM trips WHERE user_id = ? ORDER BY start_date DESC').all(req.user.id);
        res.json(trips);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error retrieving trips.' });
    }
});

// Create a new trip (itinerary is generated separately via /api/ai/generate-itinerary, then saved here)
router.post('/', authenticateToken, (req, res) => {
    const { destination, start_date, end_date, budget_limit, travel_style, companion_type, itinerary, hotels, packing } = req.body;

    if (!destination || !start_date || !end_date || !budget_limit || !travel_style || !companion_type) {
        return res.status(400).json({ error: 'Required trip fields are missing.' });
    }

    const insertTrip = db.transaction(() => {
        // 1. Save trip
        const tripInfo = db.prepare(`
            INSERT INTO trips (user_id, destination, start_date, end_date, budget_limit, travel_style, companion_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(req.user.id, destination, start_date, end_date, budget_limit, travel_style, companion_type);

        const tripId = tripInfo.lastInsertRowid;

        // 2. Save itineraries (if provided)
        if (itinerary && Array.isArray(itinerary)) {
            const insertItineraryStmt = db.prepare(`
                INSERT INTO itineraries (trip_id, day_number, morning_act, afternoon_act, evening_act, transport_info, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            for (const day of itinerary) {
                insertItineraryStmt.run(
                    tripId,
                    day.day_number,
                    day.morning_act || '',
                    day.afternoon_act || '',
                    day.evening_act || '',
                    day.transport_info || '',
                    day.notes || ''
                );
            }
        }

        // 3. Save suggested hotels (if provided)
        if (hotels && Array.isArray(hotels)) {
            const insertHotelStmt = db.prepare(`
                INSERT INTO hotels (trip_id, name, rating, price_level, description)
                VALUES (?, ?, ?, ?, ?)
            `);
            for (const hotel of hotels) {
                insertHotelStmt.run(
                    tripId,
                    hotel.name,
                    hotel.rating || 4.0,
                    hotel.price_level || 'Mid-range',
                    hotel.description || ''
                );
            }
        }

        // 4. Save packing list (if provided)
        if (packing && Array.isArray(packing)) {
            const insertPackingStmt = db.prepare(`
                INSERT INTO packing_items (trip_id, item_name, category, packed)
                VALUES (?, ?, ?, 0)
            `);
            for (const item of packing) {
                insertPackingStmt.run(
                    tripId,
                    item.item_name || item,
                    item.category || 'Other'
                );
            }
        }

        return tripId;
    });

    try {
        const tripId = insertTrip();
        res.status(201).json({ message: 'Trip created successfully', tripId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error saving trip.' });
    }
});

// Get detailed trip information by ID
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const tripId = req.params.id;
        
        // Fetch trip info and verify ownership
        const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?').get(tripId, req.user.id);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found or unauthorized.' });
        }

        // Fetch related tables
        const itinerary = db.prepare('SELECT * FROM itineraries WHERE trip_id = ? ORDER BY day_number ASC').all(tripId);
        const hotels = db.prepare('SELECT * FROM hotels WHERE trip_id = ?').all(tripId);
        const expenses = db.prepare('SELECT * FROM expenses WHERE trip_id = ? ORDER BY date DESC').all(tripId);
        const packing = db.prepare('SELECT * FROM packing_items WHERE trip_id = ?').all(tripId);

        res.json({
            ...trip,
            itinerary,
            hotels,
            expenses,
            packing
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error retrieving trip details.' });
    }
});

// Update packing list item checked state
router.put('/:id/packing/:itemId', authenticateToken, (req, res) => {
    const { packed } = req.body;
    try {
        const trip = db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found.' });
        }

        db.prepare('UPDATE packing_items SET packed = ? WHERE id = ? AND trip_id = ?')
            .run(packed ? 1 : 0, req.params.itemId, req.params.id);

        res.json({ message: 'Packing item status updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating packing item.' });
    }
});

// Delete a trip
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const trip = db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found or unauthorized.' });
        }

        db.prepare('DELETE FROM trips WHERE id = ?').run(req.params.id);
        res.json({ message: 'Trip deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting trip.' });
    }
});

module.exports = router;
