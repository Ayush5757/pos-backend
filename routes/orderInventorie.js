const express = require('express');
const { save_new_order_inventorie_customer, get_new_order_inventorie_customer, chanege_status_and_add_to_inventrie_to_table, save__order_to_existing_inventorie_customer, otp_sender, delete_status_and_add_to_inventrie_to_table, save_new_order_inventorie_customer_without_OTP } = require('../controllers/orderInventorie');
const router = express.Router();


router.route('/save/newOrder').post(save_new_order_inventorie_customer_without_OTP);
router.route('/savewithotp/newOrder').post(save_new_order_inventorie_customer);
router.route('/add/to/existingorder').post(save__order_to_existing_inventorie_customer);
router.route('/change/orderlocation/inventorie').post(chanege_status_and_add_to_inventrie_to_table);
router.route('/change/orderlocation/inventorie/delete').post(delete_status_and_add_to_inventrie_to_table);
router.route('/get/newOrder').get(get_new_order_inventorie_customer);
router.route('/otp/sender').post(otp_sender);
module.exports = {
    orderInventorieRoutes: router,
}
