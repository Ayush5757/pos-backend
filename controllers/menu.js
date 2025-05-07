const { foodTableSchema } = require("../models/food");
const { menuTableSchema } = require("../models/menu");
const {
  S3Client,
  GetObjectCommand,
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
async function fetch_menu_card_data(req, res) {
  const { shop_id } = req.query;
  try {
    let result;

    const page = parseInt(req.query.page) || 1;
    const limit = 20;

    if (!req.query.search_item) {
      if (req.query.select_cat) {
        result = await fetchMenuByCategory(shop_id, req.query.select_cat, page, limit);
      }else if (req.query.special_offer) {
        result = await fetchSpecialOfferItems(shop_id, page, limit);
      }  else {
        result = await fetchPaginatedMenu(shop_id, page, limit);
      }
    } else {
      result = await searchItems(shop_id, req.query.search_item, page, limit);
    }

    if (!result || !result.foodData) {
      return res.status(200).json({ msg: "No Menu Found", foodData: [] });
    }
    const updatedPaginatedData = [];
    for (const data of result?.foodData) {
      let foodPhotoURL = null;
      if (data?.photo) {
        const mainFoodGetObjectParams = {
          Bucket: bucketName,
          Key: data?.photo,
        };
        const mainFoodCommand = new GetObjectCommand(mainFoodGetObjectParams);
        foodPhotoURL = await getSignedUrl(s3, mainFoodCommand, {
          expiresIn: 3600,
        });
      }
      updatedPaginatedData.push({
        item_name: data?.item_name,
        price: data?.price,
        half_price: data?.half_price,
        desc: data?.desc,
        photo: data?.photo,
        cat_id: data?.cat_id,
        offer_price: data?.offer_price,
        offer_half_price: data?.offer_half_price,
        _id: data?._id,
        photoURL: foodPhotoURL,
      });
    } 
    return res.status(200).json({foodData:[...updatedPaginatedData],currentPage: result?.currentPage,totalPages: result?.totalPages,categories: result?.categories});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function fetchSpecialOfferItems(shop_id, page, limit) {
  const menu_data = await getMenuData(shop_id);
  if (!menu_data?.food_data) {
    return { msg: "No Data Found", foodData: [], currentPage: page, totalPages: 0 };
  }
  
  // Filter items with offer_price or offer_half_price greater than 0
  const specialOfferItems = menu_data.food_data.filter((food) =>
    (food.offer_price > 0 || food.offer_half_price > 0)
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = specialOfferItems.slice(startIndex, endIndex);

  if (paginatedItems.length > 0) {
    return { msg: "Special Offer Data", foodData: paginatedItems, currentPage: page, totalPages: Math.ceil(specialOfferItems.length / limit) };
  } else {
    return { msg: "No Special Offer Data Present", foodData: [], currentPage: page, totalPages: 0 };
  }
}

async function searchItems(shop_id, searchItem, page, limit) {
  const menu_data = await getMenuData(shop_id);
  if (!menu_data?.food_data) {
    return { msg: "No Data Found", foodData: [], currentPage: page, totalPages: 0 };
  }
  const matchingItems = menu_data.food_data.filter((food) =>
    new RegExp(searchItem, 'i').test(food.item_name)
  );

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = matchingItems.slice(startIndex, endIndex);

  if (paginatedItems.length > 0) {
    return { msg: "Menu Data", foodData: paginatedItems, currentPage: page, totalPages: Math.ceil(matchingItems.length / limit) };
  } else {
    return { msg: "No food Data Present Similar", foodData: [], currentPage: page, totalPages: 0 };
  }
}

async function fetchMenuByCategory(shop_id, selectedCategory, page, limit) {
  const result = await foodTableSchema.aggregate([
    {
      $match: {
        shopID: shop_id,
        "foods.categorie_id": selectedCategory,
      },
    },
    {
      $unwind: "$foods",
    },
    {
      $match: {
        "foods.categorie_id": selectedCategory,
      },
    },
    {
      $project: {
        _id: 0,
        food_data: "$foods.food_data",
      },
    },
  ]);

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = result[0]?.food_data.slice(startIndex, endIndex) || [];

  if (paginatedItems.length > 0) {
    return { msg: "Menu Data", foodData: paginatedItems, currentPage: page, totalPages: Math.ceil(result[0]?.food_data.length / limit) };
  } else {
    return { msg: "No Menu Found", foodData: [], currentPage: page, totalPages: 0 };
  }
}

async function fetchPaginatedMenu(shop_id, page, limit) {
  const menu_data = await getMenuData(shop_id);
  if (!menu_data || !menu_data.food_data) {
    return { error: "Menu not found", foodData: [] };
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = menu_data.food_data.slice(startIndex, endIndex);
  const categories = await getCategories(shop_id);

  return {
    foodData: paginatedItems,
    currentPage: page,
    totalPages: Math.ceil(menu_data.food_data.length / limit),
    categories,
  };
}

async function getMenuData(shop_id) {
  return menuTableSchema.findOne({ shopID: shop_id }, { food_data: 1 });
}

async function getCategories(shop_id) {
  return foodTableSchema.findOne({ shopID: shop_id }, { categories: 1 });
}

module.exports = {
  fetch_menu_card_data,
};
