const express = require('express');
const { add_expense, getEexpenses_by_month, getExpense_Name, deleteExpense } = require('../controllers/expense');
const router = express.Router();

router.route('/add_expense').post(add_expense);
router.route('/get_expenses_by_month').get(getEexpenses_by_month);
router.route('/getexpensesDatabyName').get(getExpense_Name);
router.route('/deleteExpanse').post(deleteExpense);
module.exports = {
    expenseRoutes:router
}