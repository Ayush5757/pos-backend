const { foodTableSchema } = require("../models/food");
const { menuTableSchema } = require("../models/menu");
const { shopRoomImageSchema } = require("../models/roomimage");
const { ObjectId } = require("mongodb");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const getRandomName = (fileName) => {
  return `${Date.now()}-${fileName}`;
};

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

async function get_categories(req, res) {
  const body = req.body;
  try {
    const existingCategories = await foodTableSchema.findOne({
      shopID: body?.shopID,
    });
    if (!existingCategories) {
      return res.status(200).json({ msg: "No Data Found", target: null });
    }
    return res
      .status(200)
      .json({ msg: "Categories", target: existingCategories?.categories });
  } catch (error) {
    return res.status(400).json({ msg: error });
  }
}

async function create_categorie(req, res) {
  const body = req.body;
  try {
    const existingCategories = await foodTableSchema.findOne({
      shopID: body?.shopID,
    });
    if (!existingCategories) {
      const newCategories = new foodTableSchema({
        shopID: body?.shopID,
        categories: [
          {
            categorie_name: body?.categorie_name,
          },
        ],
      });
      await newCategories.save();
    } else {
      existingCategories.categories.push({
        categorie_name: body?.categorie_name,
      });
      await existingCategories.save();
    }
    return res.status(200).json({ msg: "Categorie added" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function delete_categorie(req, res) {
  const { shopID, cat_ID } = req.body;
  try {
    const filter = { shopID, "categories._id": cat_ID };
    const category = await foodTableSchema.findOne(filter);

    if (!category) {
      return res
        .status(404)
        .json({ message: "Category not found or shop not found." });
    }

    if (
      category.foods.some(
        (food) => food.categorie_id === cat_ID && food.food_data.length > 0
      )
    ) {
      return res
        .status(400)
        .json({ message: "Cannot delete category with associated food data." });
    }

    const update = {
      $pull: {
        categories: { _id: cat_ID },
        foods: { categorie_id: cat_ID },
      },
    };

    const result = await foodTableSchema.findOneAndUpdate(filter, update, {
      new: true,
    });

    return res.status(200).json({ message: "Category deleted successfully." });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function update_categorie(req, res) {
  const { shopID, cat_ID, categorie_name } = req.body;
  try {
    const filter = { shopID, "categories._id": cat_ID };
    const category = await foodTableSchema.findOne(filter);

    if (!category) {
      return res
        .status(404)
        .json({ message: "Category not found or shop not found." });
    }

    const update = {
      $set: {
        "categories.$.categorie_name": categorie_name,
      },
    };

    const result = await foodTableSchema.findOneAndUpdate(filter, update, {
      new: true,
    });
    if (!result) {
      return res.status(400).json({ message: "Somthing Went Wrong" });
    }
    return res
      .status(200)
      .json({ message: "Category name updated successfully." });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

// ------------ food

async function get_food(req, res) {
  const body = req.params;
  try {
    const existingCategories = await foodTableSchema.findOne({
      shopID: body?.id,
    });
    if (!existingCategories) {
      return res.status(200).json({ msg: "No Data Found", target: null });
    }
    return res
      .status(200)
      .json({ msg: "food data", target: existingCategories?.foods });
  } catch (error) {
    return res.status(400).json({ msg: error });
  }
}

async function getPaginatedCategories(req, res) {
  const { shopID, page = 1, limit = 30 } = req.query;
  console.log("aysuh callsed");
  try {
    const foodDocument = await foodTableSchema.findOne(
      { shopID: shopID },
      { categories: { $slice: [(page - 1) * limit, limit] } }
    );

    if (!foodDocument || !foodDocument.categories.length) {
      return res.status(200).json({ msg: "No categories found" });
    }

    const totalCategories = foodDocument.categories.length;
    const totalPages = Math.ceil(totalCategories / limit);

    return res.status(200).json({
      msg: "Categories list",
      target: foodDocument.categories,
      pageInfo: {
        totalItems: totalCategories,
        totalPages,
        currentPage: parseInt(page) || 1,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function getPaginatedFoodData(req, res) {
  const { shopID, categorie_id, page = 1, limit = 50 } = req.query;

  try {
    const foodDocument = await foodTableSchema.findOne(
      { shopID: shopID, "foods.categorie_id": categorie_id },
      { "foods.$": 1 } // Projection to get only the matching food array
    );

    if (!foodDocument || !foodDocument.foods || !foodDocument.foods.length) {
      return res.status(200).json({ msg: "No food data found" });
    }

    const foodDataArray = foodDocument.foods[0].food_data || [];
    const totalFoodData = foodDataArray.length;
    const totalPages = Math.ceil(totalFoodData / limit);

    const paginatedFoodData = foodDataArray.slice(
      (page - 1) * limit,
      page * limit
    );

    const updatedPaginatedData = [];

    for (const data of paginatedFoodData) {
      let foodPhotoURL = null;
      if (data?.photo) {
        const mainFoodGetObjectParams = {
          Bucket: bucketName,
          Key: data?.photo,
        };
        const mainFoodCommand = new GetObjectCommand(mainFoodGetObjectParams);
        foodPhotoURL = await getSignedUrl(s3, mainFoodCommand, {
          expiresIn: 10800,
        });
      }
      updatedPaginatedData.push({
        item_name: data?.item_name,
        price: data?.price,
        photo: data?.photo,
        photoURL: foodPhotoURL,
        half_price: data?.half_price,
        offer_price: data?.offer_price,
        offer_half_price: data?.offer_half_price,
        desc: data?.desc,
        _id: data?._id,
      });
    }

    return res.status(200).json({
      msg: "Food data list",
      target: updatedPaginatedData,
      categorie_id: categorie_id,
      pageInfo: {
        totalItems: totalFoodData,
        totalPages,
        currentPage: parseInt(page) || 1,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

// --- room
async function get_room(req, res) {
  const body = req.params;
  const searchItem = req.params.search || ""; // Get the search term from query parameters
  try {
    const page = parseInt(body.page) || 1;
    const perPage = 15; // Define the number of items per page (you can adjust this as needed)

    const existingShop = await shopRoomImageSchema.findOne({ shopID: body.id });

    if (!existingShop) {
      return res.status(200).json({ msg: "Shop Not Found", target: null });
    }

    const roomData = existingShop.rooms || [];

    const filteredData = roomData.filter((room) =>
      room.roomName.toLowerCase().includes(searchItem.toLowerCase())
    );

    const skip = (page - 1) * perPage;
    const paginatedData = filteredData.slice(skip, skip + perPage);
    const updatedPaginatedData = [];

    for (const data of paginatedData) {
      let mainRoomUrl = null;
      if (data?.roomFirstPic) {
        const mainRoomGetObjectParams = {
          Bucket: bucketName,
          Key: data?.roomFirstPic,
        };
        const mainRoomCommand = new GetObjectCommand(mainRoomGetObjectParams);
        mainRoomUrl = await getSignedUrl(s3, mainRoomCommand, {
          expiresIn: 10800,
        });
      }

      let additionalPicUrl = null;
      if (data.additionalPic) {
        const additionalPicGetObjectParams = {
          Bucket: bucketName,
          Key: data.additionalPic,
        };
        const additionalPicCommand = new GetObjectCommand(
          additionalPicGetObjectParams
        );
        additionalPicUrl = await getSignedUrl(s3, additionalPicCommand, {
          expiresIn: 10800,
        });
      }

      updatedPaginatedData.push({
        roomName: data?.roomName,
        roomPrice: data?.roomPrice,
        roomFirstPic: data?.roomFirstPic,
        additionalPic: data?.additionalPic,
        about: data?.about,
        _id: data?._id,
        imageUrl: mainRoomUrl,
        additionalImageUrl: additionalPicUrl,
      });
    }
    return res.status(200).json({
      currentPage: page,
      perPage,
      totalItems: filteredData.length,
      totalPages: Math.ceil(filteredData.length / perPage),
      target: updatedPaginatedData,
      title: existingShop?.title
    });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function get_room_limit(req, res) {
  const body = req.params;
  try {
    const perPage = 4;
    const page = req.query.page || 1;

    const existingShop = await shopRoomImageSchema.findOne({ shopID: body.id });

    if (!existingShop) {
      return res.status(200).json({ msg: "Shop Not Found", target: null });
    }

    const roomData = existingShop.rooms || [];
    const totalPages = Math.ceil(roomData.length / perPage);

    const limitedData = await shopRoomImageSchema
      .findOne({ shopID: body.id })
      .select({ rooms: { $slice: [(page - 1) * perPage, perPage] } });

    // Generate signed URLs for roomFirstPic
    const updatedLimitedData = await Promise.all(
      limitedData.rooms.map(async (room) => {
        const roomFirstPicURL = await generateSignedURL(room.roomFirstPic);
        return { ...room._doc, roomFirstPicURL };
      })
    );

    return res.status(200).json({
      target: updatedLimitedData,
      title: existingShop?.title
      // pageInfo: {
      //   totalItems: roomData.length,
      //   totalPages,
      //   currentPage: parseInt(page) || 1,
      //   itemsPerPage: perPage,
      // },
    });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function generateSignedURL(photoKey) {
  const getObjectParams = {
    Bucket: bucketName, // Your bucket name
    Key: photoKey,
  };

  const command = new GetObjectCommand(getObjectParams);
  return getSignedUrl(s3, command, { expiresIn: 10800 }); // Adjust expiresIn as needed
}

async function add_food(req, res) {
  const body = req.body;
  const file = req.file;
  console.log("file", req.file);
  try {
    const [existingCategories, existingMenuTable] = await Promise.all([
      foodTableSchema.findOne({ shopID: body?.shopID }),
      menuTableSchema.findOne({ shopID: body?.shopID }),
    ]);

    let tempName = null;
    if (req?.file?.originalname) {
      tempName = getRandomName(req?.file?.originalname);
      const params = {
        Bucket: bucketName,
        Key: tempName,
        Body: req?.file?.buffer,
        ContentType: req?.file?.mimetype,
      };
      const command = new PutObjectCommand(params);
      await s3.send(command);
    }

    if (!existingCategories) {
      const newCategory = new foodTableSchema({
        shopID: body?.shopID,
        foods: [
          {
            categorie_name: body?.categorie_name,
            categorie_id: body?.categorie_id,
            food_data: {
              item_name: body?.item_name,
              price: body?.price,
              half_price: body?.half_price,
              desc: body?.desc,
              photo: tempName,
              offer_price: body?.offer_price,
              offer_half_price: body?.offer_half_price
            },
          },
        ],
      });
      await newCategory.save();
    } else {
      const existingCategoryIndex = existingCategories.foods.findIndex(
        (food) => food.categorie_id === body?.categorie_id
      );

      if (existingCategoryIndex !== -1) {
        existingCategories.foods[existingCategoryIndex].food_data.push({
          item_name: body?.item_name,
          price: body?.price,
          half_price: body?.half_price,
          desc: body?.desc,
          photo: tempName,
          offer_price: body?.offer_price,
          offer_half_price: body?.offer_half_price
        });
      } else {
        existingCategories.foods.push({
          categorie_name: body?.categorie_name,
          categorie_id: body?.categorie_id,
          food_data: {
            item_name: body?.item_name,
            price: body?.price,
            half_price: body?.half_price,
            desc: body?.desc,
            photo: tempName,
            offer_price: body?.offer_price,
            offer_half_price: body?.offer_half_price
          },
        });
      }

      await existingCategories.save();
    }

    if (!existingMenuTable) {
      const newMenuTable = new menuTableSchema({
        shopID: body?.shopID,
        food_data: [
          {
            item_name: body?.item_name,
            price: body?.price,
            half_price: body?.half_price,
            desc: body?.desc,
            photo: tempName,
            offer_price: body?.offer_price,
            offer_half_price: body?.offer_half_price,
            cat_id: body?.categorie_id,
          },
        ],
      });

      await newMenuTable.save();
    } else {
      existingMenuTable.food_data.push({
        item_name: body?.item_name,
        price: body?.price,
        half_price: body?.half_price,
        desc: body?.desc,
        photo: tempName,
        offer_price: body?.offer_price,
        offer_half_price: body?.offer_half_price,
        cat_id: body?.categorie_id,
      });

      await existingMenuTable.save();
    }

    return res.status(200).json({ msg: "Food added successfully" });
  } catch (error) {
    console.error("Error adding food:", error);
    return res
      .status(400)
      .json({ msg: `An error occurred while adding food: ${error.message}` });
  }
}

async function update_food(req, res) {
  const body = req.body;
  console.log("body?.shopID", body);
  try {
    const [existingCategories, existingMenuTable] = await Promise.all([
      foodTableSchema.findOne({ shopID: body?.shopID }),
      menuTableSchema.findOne({ shopID: body?.shopID }),
    ]);
    // console.log('existingCategories',existingCategories);

    const existingCategoryIndex = existingCategories.foods.findIndex(
      (food) => food.categorie_id === body?.categorie_id
    );
    
    if (existingCategoryIndex === -1) {
      return res.status(400).json({ msg: "Index not found" });
    }
    const existingfoodDataIndex = existingCategories?.foods[
      existingCategoryIndex
    ]?.food_data?.findIndex((food) => food?._id.equals(body?._id));

    if (existingfoodDataIndex === -1) {
      return res.status(400).json({ msg: "Index not found" });
    }
    if (existingCategoryIndex !== -1) {
      existingCategories.foods[existingCategoryIndex].food_data[
        existingfoodDataIndex
      ] = {
        ...body,
      };
    }

    const index = existingMenuTable?.food_data?.findIndex(
      (food) => food?.photo === body?.photo
    );
    if (index === -1) {
      return res.status(400).json({ msg: "Menu Index not found" });
    }
    existingMenuTable.food_data[index] = {
      item_name: body?.item_name,
      price: body?.price,
      desc: body?.desc,
      photo: body?.photo,
      cat_id: body?.categorie_id,
      half_price: body?.half_price,
      offer_price: body?.offer_price,
      offer_half_price: body?.offer_half_price
    };
    await existingMenuTable.save();
    await existingCategories.save();
    return res.status(200).json({ msg: "Food update successfully" });
  } catch (error) {
    console.error("Error adding food:", error);
    return res
      .status(400)
      .json({ msg: `An error occurred while adding food: ${error.message}` });
  }
}

async function add_room(req, res) {
  try {
    const body = req.body;
    const existingRoom = await shopRoomImageSchema.findOne({
      shopID: body?.shopID,
    });
    let tempName = null;
    if (req?.file?.originalname) {
      tempName = getRandomName(req?.file?.originalname);
      const params = {
        Bucket: bucketName,
        Key: tempName,
        Body: req?.file?.buffer,
        ContentType: req?.file?.mimetype,
      };
      const command = new PutObjectCommand(params);
      await s3.send(command);
    }
    if (!existingRoom) {
      const newRoom = new shopRoomImageSchema({
        shopID: body?.shopID,
        rooms: [
          {
            roomName: body?.roomName,
            roomPrice: body?.roomPrice,
            roomFirstPic: tempName,
            about: body?.about,
          },
        ],
      });
      await newRoom.save();
    } else {
      const roomUpdate = {};
      if (body?.isAdditional || body?.room_id) {
        roomUpdate["rooms.$[element].roomName"] = body?.roomName;
        roomUpdate["rooms.$[element].roomPrice"] = body?.roomPrice;
        roomUpdate["rooms.$[element].about"] = body?.about;
        if (tempName) {
          if (!body?.roomFirstPic) {
            roomUpdate["rooms.$[element].roomFirstPic"] = tempName;
          } else {
            roomUpdate["rooms.$[element].additionalPic"] = tempName;
          }
        } else {
          roomUpdate["rooms.$[element].roomFirstPic"] = body?.roomFirstPic;
          roomUpdate["rooms.$[element].additionalPic"] = body?.additionalPic;
        }
      } else {
        roomUpdate["$push"] = {
          rooms: {
            roomName: body?.roomName,
            roomPrice: body?.roomPrice,
            roomFirstPic: tempName,
            about: body?.about,
          },
        };
      }

      await shopRoomImageSchema.updateOne(
        { shopID: body?.shopID },
        roomUpdate,
        {
          arrayFilters: [{ "element._id": new ObjectId(body?.room_id) }],
        }
      );
    }

    return res.status(200).json({ msg: "Room added successfully" });
  } catch (error) {
    console.error("Error adding Room:", error);
    return res
      .status(400)
      .json({ msg: `An error occurred while adding Room: ${error.message}` });
  }
}

async function get_menu_food(req, res) {
  const shopID = req?.query?.shopID;
  const catID = req?.query?.catID;

  try {
    const existingCategories = await foodTableSchema.findOne({ shopID });

    if (!existingCategories) {
      return res.status(200).json({ msg: "No Data Found", target: null });
    } else {
      const searchItem = req?.query?.searchItem;

      if (searchItem !== undefined) {
        const filteredFoods = existingCategories?.foods
          .map((data) =>
            data?.food_data?.filter((foodItem) =>
              foodItem?.item_name
                ?.toLowerCase()
                ?.includes(searchItem?.toLowerCase())
            )
          )
          .flat();

        if (filteredFoods?.length > 0) {
          const updatedData = [];
          for (const data of filteredFoods) {
            let foodPhotoURL = null;
            if (data?.photo) {
              const mainFoodGetObjectParams = {
                Bucket: bucketName,
                Key: data?.photo,
              }; 
              const mainFoodCommand = new GetObjectCommand(mainFoodGetObjectParams);
              foodPhotoURL = await getSignedUrl(s3, mainFoodCommand, {
                expiresIn: 10800,
              });
            }
            updatedData.push({
              _id: data?._id,
              item_name: data?.item_name,
              price: data?.price,
              half_price: data?.half_price,
              desc: data?.desc,
              photo: data?.photo,
              photoURL: foodPhotoURL,
            });
          }
          return res.status(200).json({
            msg: "Filtered menu food data",
            target: updatedData,
          });
        } else {
          return res.status(200).json({ msg: "No matching items found" });
        }
      }

      const existingCategoryIndex = existingCategories.foods.findIndex(
        (food) => food.categorie_id === catID
      );
      let mainData = existingCategories?.foods[existingCategoryIndex]?.food_data;
      if(mainData?.length>0 && existingCategoryIndex !== -1){
        const updatedData = [];
        for (const data of mainData) {
          let foodPhotoURL = null;
          if (data?.photo) {
            const mainFoodGetObjectParams = {
              Bucket: bucketName,
              Key: data?.photo,
            }; 
            const mainFoodCommand = new GetObjectCommand(mainFoodGetObjectParams);
            foodPhotoURL = await getSignedUrl(s3, mainFoodCommand, {
              expiresIn: 10800,
            });
          }
          updatedData.push({
            _id: data?._id,
            item_name: data?.item_name,
            price: data?.price,
            half_price: data?.half_price,
            desc: data?.desc,
            photo: data?.photo,
            photoURL: foodPhotoURL,
          });
        }
        return res.status(200).json({
          msg: "Selected Menu Food Data",
          target: updatedData,
        });
      }else{
        return res.status(200).json({ msg: "No Food Added To This Category" });
      }
  }
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ msg: "An error occurred", error: error.message });
  }
}

async function delete_product(req, res) {
  console.log("req", req);
  try {
    const existingCategories = await findFoodTableData(
      req?.body?.authUser?._id,
      req?.body?.categorie_id
    );

    if (!existingCategories) {
      return res.status(400).json({ msg: "There is No Shop" });
    }

    const existingCategoryIndex = existingCategories?.foods?.findIndex(
      (food) => food.categorie_id === req?.body?.categorie_id
    );

    if (existingCategoryIndex < 0) {
      return res.status(400).json({ msg: "There is No Category" });
    }

    existingCategories.foods[existingCategoryIndex].food_data =
      existingCategories.foods[existingCategoryIndex].food_data?.filter(
        (item) => item?._id.toString() !== req?.body?.item_id
      );

    await existingCategories.save();

    await deleteFromMenuTable(req?.body?.authUser?._id, req?.body?.image);

    return res.status(200).json({ msg: "Item Deleted Successfully" });
  } catch (error) {
    return res.status(400).json({ msg: `An error occurred: ${error.message}` });
  }
}

async function delete_room(req, res) {
  try {
    const deleteImage = async (pic) => {
      if (pic) {
        const params = { Bucket: bucketName, Key: pic };
        const command = new DeleteObjectCommand(params);
        await s3.send(command);
      }
    };

    await Promise.all([
      deleteImage(req?.body?.selectedItem?.roomFirstPic),
      deleteImage(req?.body?.selectedItem?.additionalPic),
    ]);

    const result = await shopRoomImageSchema.updateOne(
      { shopID: req?.body?.authUser?._id },
      { $pull: { rooms: { _id: req?.body?.selectedItem?._id } } }
    );

    if (!result) {
      return res.status(400).json({ msg: "No Room There With This Info" });
    }

    return res.status(200).json({ msg: "Room removed successfully." });
  } catch (error) {
    return res.status(400).json({ msg: `An error occurred: ${error.message}` });
  }
}

async function findFoodTableData(shopID, categoryID) {
  return await foodTableSchema.findOne({
    shopID,
    "foods.categorie_id": categoryID,
  });
}

async function deleteFromMenuTable(shopID, image) {
  const menuTableData = await menuTableSchema.findOne({ shopID });

  if (menuTableData) {
    menuTableData.food_data = menuTableData.food_data?.filter(
      (item) => item?.photo !== image
    );
    await menuTableData.save();
  }
}


async function title_room(req, res) {
  try {
    const updatedDocument = await shopRoomImageSchema.findOneAndUpdate(
      { shopID:req?.body?.authUser?._id },
      { $set: { title: req?.body?.heading } },
      { new: true }
    );
    if (!updatedDocument) {
      return res.status(400).json({ msg: "Shop Not Found" });
    }
    return res.status(200).json({ msg: "New Title Added" });
  } catch (error) {
    return res.status(400).json({ msg: `An error occurred: ${error.message}` });
  }
}
module.exports = {
  get_categories,
  create_categorie,
  delete_categorie,
  get_food,
  add_food,
  get_menu_food,
  delete_product,
  add_room,
  get_room,
  delete_room,
  update_food,
  get_room_limit,
  getPaginatedCategories,
  getPaginatedFoodData,
  update_categorie,
  title_room
};
