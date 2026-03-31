const mongoose = require('mongoose');

let cachedConnection = null;

const connectMongoDB = async () => {
    if (cachedConnection) {
        return cachedConnection;
    }

    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/messDataBase';
        
        // Options for robust connection
        const options = {
            serverSelectionTimeoutMS: 5000, // 5 seconds timeout
            socketTimeoutMS: 45000, 
        };

        const conn = await mongoose.connect(mongoURI, options);
        cachedConnection = conn;
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // Instead of exiting, we throw so the caller knows it failed
        throw error;
    }
};

module.exports = { connectMongoDB };
