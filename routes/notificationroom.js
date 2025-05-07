
const express = require('express');
const { get_pending_booked_room_data, get_already_booked_room_data, fetch_is_room_booked, fetch_latest_shop_orders } = require('../controllers/notificationroom');
const router = express.Router();
router.route('/roomBooking').get(fetch_is_room_booked)
router.route('/latestOrder').get(fetch_latest_shop_orders)
router.route('/get/alreadyorderd/items').post(get_already_booked_room_data)
router.route('/get/pendingordered/pendingitems').post(get_pending_booked_room_data)
module.exports = {
    notificationroomRouter:router
}