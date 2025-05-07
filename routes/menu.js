const express = require('express');
const { save_order, } = require('../controllers/inventorie');
const { fetch_menu_card_data } = require('../controllers/menu');
const router = express.Router();


router.route('/menuCard').get(fetch_menu_card_data);
module.exports = {
    menuRouter:router
}