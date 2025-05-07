const express = require('express');
const { save_order, fetch_order_table_inventories, confirm_order, customer_save_inventorie, save_fast_inventorie, KOT_send_to_kitchen, complete_fast_inventorie, get_fast_orders_inventorie_list, cancel_fast_orders_inventorie, completeFastOrdersInventory } = require('../controllers/inventorie');
const router = express.Router();
const router2 = express.Router();
const router3 = express.Router();

router.route('/save').post(save_order);
router.route('/inventries_fetch_by_tableid_API').post(fetch_order_table_inventories);
router.route('/confirmOrder').post(confirm_order);
router.route('/fast/inventorie/complete').post(completeFastOrdersInventory);
router.route('/fast/inventorie/save').post(save_fast_inventorie);
router.route('/fast/inventorie/get/fastOrders/list').get(get_fast_orders_inventorie_list);

router3.route('/fast/inventorie/cancel/fastOrders').post(cancel_fast_orders_inventorie);
router3.route('/fast/inventorie/completeby/fastOrders').post(completeFastOrdersInventory);

router2.route('/save/newOrder').post(customer_save_inventorie);
module.exports = {
    orderRoutes: router,
    customerOrderRoute: router2,
    orderRoutewithIO: router3
}