const Expense = require('../models/expense.model');
const { handle200, handle201, handle404, handle422, handle500 } = require('../helper/responseHandler');

// @desc    Get all expenses (with server-side filtering)
// @route   GET /api/expenses?month=2026-03&category=Vegetables
// @access  Private
const getExpenses = async (req, res) => {
    try {
        const { month, category } = req.query;
        const filter = {};

        if (month) {
            const startDate = new Date(`${month}-01T00:00:00.000Z`);
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            filter.date = { $gte: startDate, $lt: endDate };
        }
        if (category && category !== 'all') filter.category = category;

        const expenses = await Expense.find(filter).sort({ date: -1 });
        handle200(res, expenses);
    } catch (error) {
        handle500(res, error);
    }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res) => {
    try {
        if (req.body.amount) req.body.amount = Number(req.body.amount);
        const expense = await Expense.create(req.body);
        handle201(res, expense);
    } catch (error) {
        handle422(res, error);
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return handle404(res, 'Expense not found');
        }

        const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true
        });

        handle200(res, updatedExpense);
    } catch (error) {
        handle422(res, error);
    }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return handle404(res, 'Expense not found');
        }

        await expense.deleteOne();
        handle200(res, { id: req.params.id });
    } catch (error) {
        handle500(res, error);
    }
};

module.exports = {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
};
