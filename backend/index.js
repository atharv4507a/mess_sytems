require('dotenv').config();
const express = require("express");
const path = require('path');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const { connectMongoDB } = require('./src/config/mongoDB');

app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectMongoDB();

// Serve frontend static files from the build directory
app.use(express.static(path.join(__dirname, 'public/frontend')));

const mongoose = require('mongoose');

// health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        database: mongoose.connection && mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    });
});

// API Routes
app.use('/api', require('./src/routes/index'));

// Root Route
app.get('/', (req, res) => {
    res.send('Hello World');
});

// Catch-all route for SPA navigation (Express 5 compatible)
app.get('/*path', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/frontend', 'index.html'));
});
//

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Example app listening at http://localhost:${PORT}`);
    });
}

module.exports = app;
