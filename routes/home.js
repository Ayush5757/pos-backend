const express = require('express');
const { send_home_contact_us, get_home_pictures_URL } = require('../controllers/home');
const router = express.Router();

router.route('/contactUs/send').post(send_home_contact_us);
router.route('/getPhotos').get(get_home_pictures_URL);
module.exports = {
    homeRoutes:router
}