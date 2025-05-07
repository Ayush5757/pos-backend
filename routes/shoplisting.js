const express = require('express');
const { get_shop_listing_shopList, get_shop_listing_shopList_main, get_food_data } = require('../controllers/shoplisting');
const router = express.Router();



router.route('/get-shop-list-shoplist').get(get_shop_listing_shopList);
router.route('/get-shop-list-main/shop').get(get_shop_listing_shopList_main);
router.route('/getFoodData').get(get_food_data);
module.exports = {
    shopListing:router
}