const express = require('express');
const { add_new_reminder, get_reminder, delete_reminder } = require('../controllers/reminder');
const router = express.Router();

router.route('/addNew').post(add_new_reminder);
router.route('/delete').post(delete_reminder);
router.route('/getReminder').get(get_reminder);
module.exports = {
    reminderRoute:router
}