const express = require('express');
const { waiter_get_tables, get_menu_food_waiter, get_categories_waiter, fetch_order_table_inventories_waiter, save_order_waiter, is_valid_waiter } = require('../controllers/waiter');
const router = express.Router();
const router2 = express.Router();
router.route('/getTables').post(waiter_get_tables);
router.route('/getMenu').get(get_menu_food_waiter);
router.route('/getCategories').get(get_categories_waiter);
router.route('/isWaiterValid').get(is_valid_waiter);
router.route('/inventries_fetch_by_tableid_API_Waiter').post(fetch_order_table_inventories_waiter);
router2.route('/save').post(save_order_waiter);
module.exports = {
    WaitertableRoutes:router,
    WaitertableRoutes2:router2
}
