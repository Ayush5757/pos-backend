const express = require('express');
const { getEexpenses_and_sales_by_month } = require('../controllers/dashboard');
const router = express.Router();
router.route('/getSalesandExpensesTotal').get(getEexpenses_and_sales_by_month);
module.exports = {
    dashBoardRoutes:router
}