const { foodTableSchema } = require("../models/food");
const { User } = require("../models/user");

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});



async function get_shop_listing_shopList(req, res) {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 15;

  try {
    const fields = {
      shopEmail: 0,
      shopPassword: 0,
      day_offs: 0,
      menu_instance_image: 0,
      createdAt: 0,
      updatedAt: 0,
      __v: 0,
      alt_phone: 0,
      end_time: 0,
      extra_time_info: 0,
      shop_google_address: 0,
      start_time: 0,
      waths_app_number: 0,
    };

    const query = {};

    if (req.query?.search_name) {
      query.shopName = { $regex: req.query.search_name, $options: 'i' };
    }

    if (req.query?.pincode) {
      query.pincode = { $regex: req.query.pincode, $options: 'i' };
    }

    if (req.query?.city) {
      query.city = { $regex: req.query.city, $options: 'i' };
    }

    query.user_complete = 1;

    const totalUsers = await User.countDocuments(query);

    const shopList = await User.find(query, fields)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    if (!shopList || shopList.length === 0) {
      return res.status(200).json({ msg: "No Data Found" });
    }

    // Generate signed URLs for each image in banner_image
    const updatedShopList = await Promise.all(
      shopList.map(async (user) => {
        const bannerImages = await Promise.all(
          user.banner_image.map(async (image) => {
            const photoURL = await generateSignedURL(image.photo);
            return { photo: image.photo, photoURL };
          })
        );

        return { ...user._doc, banner_image: bannerImages };
      })
    );

    return res.status(200).json({
      msg: "shopList",
      target: updatedShopList,
      totalPages: Math.ceil(totalUsers / pageSize),
      currentPage: page,
    });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function generateSignedURL(photoKey) {
  const getObjectParams = {
    Bucket: bucketName,
    Key: photoKey,
  };

  const command = new GetObjectCommand(getObjectParams);
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}


async function get_shop_listing_shopList_main(req, res) {
  try {
    const fields = { shopPassword: 0 };

    const shopData = await User.find({
      _id: req.query?.shop_id
    }, fields);

    if (!shopData || shopData.length === 0) {
      return res.status(400).json({ msg: "No Data Found" });
    }

    const updatedShopData = await Promise.all(
      shopData.map(async (user) => {
        const bannerImages = await processImages(user.banner_image);
        const menuInstanceImages = await processImages(user.menu_instance_image);

        return { ...user._doc, banner_image: bannerImages, menu_instance_image: menuInstanceImages };
      })
    );

    return res.status(200).json({ msg: "shop_data", target: updatedShopData });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function processImages(images) {
  return Promise.all(
    images.map(async (image) => {
      const photoURL = await generateSignedURL(image.photo);
      return { photo: image.photo, photoURL };
    })
  );
}

async function generateSignedURL(photoKey) {
  const getObjectParams = {
    Bucket: bucketName,
    Key: photoKey,
  };

  const command = new GetObjectCommand(getObjectParams);
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

async function get_food_data(req, res) {
  try {
    const shopData = await foodTableSchema
      .findOne({ shopID: req.query?.shop_id })
      .select("categories");

    if (!shopData) {
      return res.status(200).json({ msg: "Shop not found" });
    }

    const foodsData = await foodTableSchema.aggregate([
      { $match: { shopID: req.query?.shop_id } },
      { $unwind: "$foods" },
      {
        $project: {
          categorie_name: "$foods.categorie_name",
          firstFoodData: { $arrayElemAt: ["$foods.food_data", 0] },
        },
      },
      { $limit: 4 },
    ]);

    // Generate signed URLs for the photos
    const updatedFoodsData = await Promise.all(
      foodsData.map(async (food) => {
        const photoURL = await generateSignedURL(food.firstFoodData.photo);
        return {
          categorie_name: food.categorie_name,
          firstFoodData: { ...food.firstFoodData, photoURL },
        };
      })
    );

    return res
      .status(200)
      .json({ msg: "shop_data", target: { foodsData: updatedFoodsData, allCategories: shopData?.categories } });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error" });
  }
}

async function generateSignedURL(photoKey) {
  const getObjectParams = {
    Bucket: bucketName, // Your bucket name
    Key: photoKey,
  };

  const command = new GetObjectCommand(getObjectParams);
  return getSignedUrl(s3, command, { expiresIn: 3600 }); // Adjust expiresIn as needed
}
module.exports = {
  get_shop_listing_shopList,
  get_shop_listing_shopList_main,
  get_food_data
};
