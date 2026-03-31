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

// API Routes
app.use('/api', require('./src/routes/index'));

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
