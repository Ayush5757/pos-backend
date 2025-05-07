const express = require('express');
const { admin_login, get_users_admin, change_status_admin, change_usercomplete_status_admin, change_otpStatus_status_admin } = require('../controllers/admin');
const router = express.Router();

router.route('/login').post(admin_login);
router.route('/users').post(get_users_admin);
router.route('/change/OTPStatusChange').post(change_otpStatus_status_admin);
router.route('/change/usercomplete').post(change_usercomplete_status_admin);
module.exports = {
    adminRoutes:router
}