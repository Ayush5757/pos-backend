
const express = require('express');
const { fetch_is_table_booked, fetch_latest_shop_orders, get_already_booked_table_data, get_pending_booked_table_data } = require('../controllers/notification');
const router = express.Router();
router.route('/tableBooking').get(fetch_is_table_booked)
router.route('/latestOrder').get(fetch_latest_shop_orders)
router.route('/get/alreadyorderd/items').post(get_already_booked_table_data)
router.route('/get/pendingordered/pendingitems').post(get_pending_booked_table_data)
module.exports = {
    notificationRouter:router
}