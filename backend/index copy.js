require('dotenv').config({ override: true });
const express = require("express");
const path = require('path');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const { connectMongoDB } = require('./src/config/mongoDB');

app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectMongoDB().catch(err => console.error("Initial MongoDB Connection Failed:", err.message));

// Environment Variable Validation
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);
if (missingEnv.length > 0) {
    console.error(`ERROR: Missing required environment variables: ${missingEnv.join(', ')}`);
}

// Serve frontend static files from the build directory
app.use(express.static(path.join(__dirname, 'public/frontend')));

const mongoose = require('mongoose');

// health check route
app.get('/api/health', async (req, res) => {
    let dbStatus = 'Disconnected';
    try {
        if (mongoose.connection && mongoose.connection.readyState === 1) {
            // Test actual connectivity
            await mongoose.connection.db.admin().ping();
            dbStatus = 'Connected';
        }
    } catch (err) {
        dbStatus = `Error: ${err.message}`;
    }

    res.status(200).json({
        status: 'OK',
        database: dbStatus,
        env: process.env.NODE_ENV,
        missing_vars: missingEnv.length > 0 ? missingEnv : undefined
    });
});

// API Routes
app.use('/api', require('./src/routes/index'));

// Root Route
app.get('/', (req, res) => {
    res.send('Hello World');
});


if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Example app listening at http://localhost:${PORT}`);
    });
}

module.exports = app;
