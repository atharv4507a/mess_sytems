const mongoose = require('mongoose');
require("../models/tiffin.model");
require("../models/bill.model");
require("../models/expense.model");
require("../models/leave.model");
require("../models/member.model");
require("../models/payment.model");
require("../models/user.model");

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const connectMongoDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            family: 4
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Automatically create collections for all models
        const modelNames = mongoose.modelNames();
        for (const name of modelNames) {
            await mongoose.model(name).createCollection().catch(err => {
                console.debug(`Collection ${name} already exists or error: ${err.message}`);
            });
        }
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { connectMongoDB };