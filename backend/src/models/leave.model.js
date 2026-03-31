const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: [true, 'Member ID is required']
    },
    date: {
        type: Date,
        required: [true, 'Date is required']
    }
}, {
    timestamps: true
});

// Ensure a member can't have duplicate leave on the same date
leaveSchema.index({ memberId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Leave', leaveSchema);
