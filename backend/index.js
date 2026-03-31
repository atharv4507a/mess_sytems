require('dotenv').config({ override: true });
const express = require("express");
const path = require('path');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

const { connectMongoDB } = require('./src/config/mongoDB');

// Connect to Database
connectMongoDB();

// Serve frontend static files from the build directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', require('./src/routes/index'));

// Database Status Route
app.get('/api/db-status', (req, res) => {
    const states = {
        0: 'Disconnected',
        1: 'Connected',
        2: 'Connecting',
        3: 'Disconnecting'
    };
    const state = mongoose.connection.readyState;
    res.json({
        status: states[state] || 'Unknown',
        readyState: state,
        database: mongoose.connection.name,
        host: mongoose.connection.host
    });
});

// Root Route
app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
});

module.exports = app;
