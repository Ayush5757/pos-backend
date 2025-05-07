const express = require('express');
const { add_comment, get_shop_comment } = require('../controllers/comment');
const router = express.Router();

router.route('/add').post(add_comment);
router.route('/getComment').get(get_shop_comment);
module.exports = {
    commentRoutes:router
}