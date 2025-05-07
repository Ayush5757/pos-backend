const express = require('express');
const { save_order, fetch_order_room_inventories, confirm_order, save_fast_inventorie, customer_save_inventorie } = require('../controllers/roomInventorie');
const router = express.Router();
const router2 = express.Router();

router.route('/save').post(save_order);
router.route('/roominventries_fetch_by_roomid_API').post(fetch_order_room_inventories);
router.route('/confirmOrder').post(confirm_order);
router.route('/fast/roominventorie/save').post(save_fast_inventorie);


router2.route('/save/newOrder').post(customer_save_inventorie);
module.exports = {
    orderRoomRoutes: router,
    customerRoomOrderRoute: router2
}