const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: [true, 'Member ID is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [1, 'Amount must be greater than 0']
    },
    method: {
        type: String,
        enum: ['Cash', 'UPI', 'Bank Transfer'],
        required: [true, 'Payment method is required']
    },
    date: {
        type: Date,
        default: Date.now
    },
    billId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
