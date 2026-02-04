const express = require('express');
const cors = require('cors');
const path = require('path')
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/registrations', registrationRoutes);

// Global Error Handler (Optional but recommended)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: 'error', message: 'Something went wrong!' });
});

module.exports = app;