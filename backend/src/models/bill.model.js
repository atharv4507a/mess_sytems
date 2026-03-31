const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: [true, 'Member ID is required']
    },
    monthYear: {
        type: String, // format 'YYYY-MM'
        required: [true, 'Month and Year is required']
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required']
    },
    status: {
        type: String,
        enum: ['Paid', 'Unpaid', 'Pending'],
        default: 'Pending'
    },
    extraCharges: [{
        name: String,
        amount: Number
    }],
    daysPresent: {
        type: Number,
        default: 0
    },
    tiffinCount: {
        type: Number,
        default: 0
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    pendingAmount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

billSchema.index({ memberId: 1, monthYear: 1 }, { unique: true });

module.exports = mongoose.model('Bill', billSchema);
