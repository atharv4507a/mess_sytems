const Tiffin = require('../models/tiffin.model');
const { handle200, handle422, handle500 } = require('../helper/responseHandler');

// @desc    Get tiffins (with server-side filtering)
// @route   GET /api/tiffins?memberId=xxx&date=2026-03-30&month=2026-03
// @access  Private
const getTiffins = async (req, res) => {
    try {
        const { memberId, date, month } = req.query;
        const filter = {};

        if (memberId) filter.memberId = memberId;
        if (date) filter.date = new Date(date);
        if (month) {
            // Match dates within the month
            const startDate = new Date(month + '-01');
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            filter.date = { $gte: startDate, $lt: endDate };
        }

        const tiffins = await Tiffin.find(filter)
            .populate('memberId', 'name mobile tiffinRate')
            .sort({ date: -1 });

        handle200(res, tiffins);
    } catch (error) {
        handle500(res, error);
    }
};

// @desc    Create or Update Tiffin Entry
// @route   POST /api/tiffins
// @access  Private
const createOrUpdateTiffin = async (req, res) => {
    try {
        const { memberId, date, tiffinCount } = req.body;

        const tiffin = await Tiffin.findOneAndUpdate(
            { memberId, date: new Date(date) },
            { $set: { tiffinCount: Number(tiffinCount) } },
            { returnDocument: 'after', upsert: true, runValidators: true }
        );

        handle200(res, tiffin);
    } catch (error) {
        handle422(res, error);
    }
};

module.exports = {
    getTiffins,
    createOrUpdateTiffin
};
