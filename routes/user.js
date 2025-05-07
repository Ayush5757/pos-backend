const express = require("express");
const {
  handelCreateUser,
  handelLoginUser,
  handel_get_user_form,
  handelForm1User,
  handelForm2User,
  handelBanner,
  handelMenuInstanceImages,
  handel_get_user_image_envalop,
  handelDeleteOtherImagesMenu,
  handelDeleteOtherImagesBanner,
  handelShopStatus,
  handelRoomInstanceImages,
  barcode_add,
  handel_get_user_barcode,
  handel_delete_barcode,
  handelGoogleLoginUser,
} = require("../controllers/user");
const multer = require("multer");

const router = express.Router();
const router2 = express.Router();
const router3 = express.Router();

const storage = multer.memoryStorage()
const upload = multer({ storage });

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     return cb(null, "./uploads");
//   },
//   filename: function (req, file, cb) {
//     let imageName = `${Date.now()}-${file.originalname}`;
//     return cb(null, imageName.replace(/\s/g, ""));
//   },
// });


router.route("/signUp").post(handelCreateUser);
router.route("/login").post(handelLoginUser);
router.route("/googlelogin").post(handelGoogleLoginUser);

router2.route("/form_1_user").post(handelForm1User);
router2.route("/form_2_user").post(handelForm2User);
router2.route("/get_form_1_details").post(handel_get_user_form);
router2.route("/get_user_image_envalop").post(handel_get_user_image_envalop);
router2.route("/delete_image_other_menu").post(handelDeleteOtherImagesMenu);
router2.route("/delete_image_other_banner").post(handelDeleteOtherImagesBanner);
router2.route("/status").post(handelShopStatus);
router2.route("/barcode-add").post(upload.single('photobarcode'),barcode_add);
router2.route("/getBarcode").post(handel_get_user_barcode);
router2.route("/delete-barcode").post(handel_delete_barcode);

router3.route('/banner/image').post(upload.single('photobanner'),handelBanner)
router3.route('/menuInstance/image').post(upload.single('photomenu'),handelMenuInstanceImages)

module.exports = {
  userRouter: router,
  userRouter_other_info: router2,
  userRouter_other_image: router3
};
