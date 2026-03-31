const mongoose = require('mongoose');
require('dotenv').config({ override: true });

let cachedConnection = null;

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const connectMongoDB = async () => {
    if (cachedConnection) {
        return cachedConnection;
    }

    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) throw new Error("MONGODB_URI is not defined in environment");

        // Log the URI but censor the password for security
        const censoredURI = mongoURI.replace(/:([^:@]+)@/, ':****@');
        console.log(`[DEBUG] Attempting connection with URI: ${censoredURI}`);

        // Options for robust connection
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4 // Force IPv4 for DNS resolution
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
