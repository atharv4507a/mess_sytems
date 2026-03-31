const mongoose = require('mongoose');
require("../models/tiffin.model");
require("../models/bill.model");
require("../models/expense.model");
require("../models/leave.model");
require("../models/member.model");
require("../models/payment.model");
require("../models/user.model");

const connectMongoDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = { connectMongoDB };