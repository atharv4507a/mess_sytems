const mongoose = require('mongoose');

const tiffinSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: [true, 'Member ID is required']
    },
    date: {
        type: Date,
        required: [true, 'Date is required']
    },
    tiffinCount: {
        type: Number,
        required: [true, 'Tiffin count is required'],
        min: [0, 'Tiffin count cannot be negative']
    }
}, {
    timestamps: true
});

// Compound index to ensure 1 entry per member per date
tiffinSchema.index({ memberId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Tiffin', tiffinSchema);
