const express = require('express');
const { create_user_kot, get_user_kot, delete_user_kot, login_user_kot, get_kot_user_inventries } = require('../controllers/kotuser');
const router = express.Router();
const router2 = express.Router();
const router3 = express.Router();

// shop owner kr skta hai these 3 routes Use
router.route('/user/create').post(create_user_kot);
router.route('/getKot/users').get(get_user_kot);
router.route('/user/delete').post(delete_user_kot);


router2.route('/user/login').post(login_user_kot);

router3.route('/getKot/data').post(get_kot_user_inventries);
// router3.route('/iscomplete').post(complete_kot);
// router3.route('/room/iscomplete').post(complete_room_kot);
module.exports = {
    kotRoutes: router,
    kot_unAut_Router: router2,
    kot_auth_Router: router3
}