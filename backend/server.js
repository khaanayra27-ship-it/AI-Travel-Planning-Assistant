require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('../database/db'); // Initialize DB on startup

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const expenseRoutes = require('./routes/expenses');
const aiRoutes = require('./routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/ai', aiRoutes);

// Base route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'AI Travel Planning Assistant API is healthy.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
