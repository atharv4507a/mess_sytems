const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [3, 'Name must be at least 3 characters long']
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        match: [/^\d{10}$/, 'Mobile number must be exactly 10 digits']
    },
    parentMobile: {
        type: String,
        match: [/^\d{10}$/, 'Parent mobile number must be exactly 10 digits'],
        default: null
    },
    address: {
        type: String,
        required: [true, 'Address is required']
    },
    joiningDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    messType: {
        type: String,
        enum: ['monthly', 'tiffin'],
        required: [true, 'Mess type is required']
    },
    foodType: {
        type: String,
        enum: ['veg', 'nonveg'],
        default: 'veg'
    },
    monthlyCharge: {
        type: Number,
        default: 0
    },
    tiffinRate: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Member', memberSchema);
