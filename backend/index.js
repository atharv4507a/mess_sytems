require('dotenv').config({ override: true });
const express = require("express");
const path = require('path');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

// Serve frontend static files from the build directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', require('./src/routes/index'));

// Root Route
app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
});

module.exports = app;
