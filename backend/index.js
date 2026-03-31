require('dotenv').config({ override: true });
const express = require("express");
const app = express();
const { connectMongoDB } = require('./src/config/mongoDB');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;

app.use(express.json());

// DEBUG ROUTE: Only this route is active
app.get('/', async (req, res) => {
    let dbStatus = 'Disconnected';
    let errorMsg = null;
    try {
        console.log("Debug Route: Attempting connection...");
        await connectMongoDB();
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            dbStatus = 'Connected';
        }
    } catch (err) {
        dbStatus = 'Failed to connect';
        errorMsg = err.message;
        console.error("Debug Route: Connection failed:", err.message);
    }

    res.json({
        message: "Debug Mode: All other routes are disabled",
        database: dbStatus,
        error: errorMsg,
        uri_prefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 25) + "..." : "NOT DEFINED"
    });
});

/* 
// --- ALL ORIGINAL CODE COMMENTED OUT ---

const path = require('path');
const cors = require('cors');
app.use(cors());

// Connect at startup
connectMongoDB().catch(err => {});

// Environment Validation
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
// ...

// Serve frontend
app.use(express.static(path.join(__dirname, 'public/frontend')));

// Health check
app.get('/api/health', async (req, res) => { ... });

// API Routes
app.use('/api', require('./src/routes/index'));

// Catch-all
app.get('/*path', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/frontend', 'index.html'));
});
*/

// Listen only if not in production (for Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Debug Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
