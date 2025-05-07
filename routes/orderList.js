const express = require('express');
const { get_order_list, get_specific_order_data, delete_order, get_order_list_room, get_specific_order_data_room, delete_order_room } = require('../controllers/orderList');
const router = express.Router();

router.route('/orders').get(get_order_list);
router.route('/specific_order').get(get_specific_order_data);
router.route('/delete').post(delete_order);

//  Room
router.route('/ordersRoom').get(get_order_list_room);
router.route('/specific_orderRoom').get(get_specific_order_data_room);
router.route('/Room/delete').post(delete_order_room);
module.exports = {
    orderListRoute:router
}