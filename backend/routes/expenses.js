const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken } = require('./auth');

// Add expense to a trip
router.post('/', authenticateToken, (req, res) => {
    const { trip_id, category, amount, date, description } = req.body;

    if (!trip_id || !category || !amount || !date) {
        return res.status(400).json({ error: 'Required fields missing.' });
    }

    try {
        // Verify user owns the trip
        const trip = db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(trip_id, req.user.id);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found or unauthorized.' });
        }

        const info = db.prepare(`
            INSERT INTO expenses (trip_id, category, amount, date, description)
            VALUES (?, ?, ?, ?, ?)
        `).run(trip_id, category, amount, date, description || '');

        res.status(201).json({
            message: 'Expense added successfully',
            expenseId: info.lastInsertRowid
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error adding expense.' });
    }
});

// Delete an expense
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const expenseId = req.params.id;

        // Verify user owns the trip associated with this expense
        const expense = db.prepare(`
            SELECT e.id, t.user_id 
            FROM expenses e
            JOIN trips t ON e.trip_id = t.id
            WHERE e.id = ?
        `).get(expenseId);

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found.' });
        }

        if (expense.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized to delete this expense.' });
        }

        db.prepare('DELETE FROM expenses WHERE id = ?').run(expenseId);
        res.json({ message: 'Expense deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting expense.' });
    }
});

module.exports = router;
