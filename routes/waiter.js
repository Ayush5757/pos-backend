const express = require('express');
const { handelLoginUser, handelCreateUser, getUser, delete_user_kot } = require('../controllers/waiter');
const router = express.Router();
const router2 = express.Router();

router.route('/login').post(handelLoginUser);

// done by shop Owner
router2.route('/user/create').post(handelCreateUser);
router2.route('/users/getuser').post(getUser);
router2.route('/users/delete').post(delete_user_kot);
module.exports = {
    WaiterRoutes: router,
    shopWaiterRoutes: router2,
}