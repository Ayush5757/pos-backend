const express = require('express');
const multer = require('multer');
const { get_categories, create_categorie, delete_categorie, get_food, add_food, get_menu_food, delete_product, add_room, get_room, delete_room, update_food, get_room_limit, getPaginatedCategories, getPaginatedFoodData, update_categorie, title_room } = require('../controllers/food');
const router = express.Router();
const router2 = express.Router();

const storage = multer.memoryStorage()
const upload = multer({ storage });




router.route('/getCategories').post(get_categories);
router2.route('/create/categorie').post(create_categorie);
router2.route('/delete/categorie').post(delete_categorie);
router2.route('/updateCategories/categorie').post(update_categorie);
router.route('/getfoods/:id/:page?').get(get_food);
router.route('/getPaginatedCategories').get(getPaginatedCategories);
router.route('/getPaginatedFoodData').get(getPaginatedFoodData);
router.route('/MenuItems').get(get_menu_food);



router2.use('/add',upload.single('photo'))
router2.route('/add').post(add_food);
router2.route('/update').post(update_food);
router2.route('/delete/product').post(delete_product);

router.route('/room/getrooms/:id/:page?/:search?').get(get_room);
router.route('/room/getroomsLimited/:id').get(get_room_limit);
router2.route('/delete/room').post(delete_room);
router2.route('/room/title/save').post(title_room);
// ----------------------

router2.use('/room/add',upload.single('roomPic'))
router2.route('/room/add').post(add_room);

module.exports = {
    foodRoutes:router,
    foodRoutes2:router2
}