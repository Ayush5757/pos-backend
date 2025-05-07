const express = require('express');
const { add_staff, get_staff_data, delete_staff_data, get_single_staff_data, staff_leave, get_single_staff_leave_data } = require('../controllers/staff');
const router = express.Router();


router.route('/getData').get(get_staff_data);
router.route('/getSingleStaffData').get(get_single_staff_data);
router.route('/getSingleStaffLeave').get(get_single_staff_leave_data);
router.route('/add').post(add_staff);
router.route('/delete').post(delete_staff_data);
router.route('/leave').post(staff_leave);
module.exports = {
    staffRouter:router
}