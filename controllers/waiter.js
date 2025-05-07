const { createWaiterToken } = require("../constants/auth");
const { foodTableSchema } = require("../models/food");
const { inventorieTableSchema } = require("../models/inventories");
const { shopTableSchema } = require("../models/table");
const { User } = require("../models/user");
const { WaiterUserTableSchema } = require("../models/waiter");
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

async function getUser(req, res) {
  const body = req.body;
  try {
    if (!body?.authUser?._id) {
      return res.status(200).json({ msg: "Token Not Matched" });
    }
    const exist = await WaiterUserTableSchema.find({
      shopID: body?.authUser?._id,
    });
    if (!exist) {
      return res.status(200).json({ msg: "Data Not Found", target: null });
    }
    return res.status(200).json({ msg: "Waiter User Data", target: exist });
  } catch (error) {
    return res.status(400).json({ msg: "somthing went wrong" });
  }
}

async function handelCreateUser(req, res) {
  const body = req.body;
  console.log("body", body);
  try {
    if (!body?.user_name || !body?.password || !body?.authUser?._id) {
      return res.status(400).json({ msg: "UserName and Password Not Correct" });
    }
    const exist = await WaiterUserTableSchema.findOneAndUpdate(
      { shopID: body?.authUser?._id },
      {
        $set: {
          user_name: body?.user_name,
          password: body?.password,
        },
      },
      { new: true }
    );

    if (exist) {
      return res.status(200).json({ msg: "Already Exist Updated" });
    }
    const new_waiter_user = new WaiterUserTableSchema({
      shopID: body?.shopID,
      user_name: body?.user_name,
      password: body?.password,
    });
    await new_waiter_user.save();

    return res.status(200).json({ msg: "New Waiter Created" });
  } catch (error) {
    return res.status(400).json({ msg: "somthing went wrong" });
  }
}

async function delete_user_kot(req, res) {
  const body = req.body;
  try {
    if (!body?.authUser?._id || !body?.user_id) {
      return res
        .status(200)
        .json({ msg: "Shop or User do not have Access to Delete" });
    }
    const isDeleted = await WaiterUserTableSchema.findOneAndDelete({
      shopID: body?.authUser?._id,
      _id: body?.user_id,
    });

    if (!isDeleted) {
      return res.status(400).json({ msg: "Can Not Delete" });
    }

    return res.status(200).json({ msg: "User Deleted Successfully" });
  } catch (error) {
    return res.status(400).json({ msg: "somthing went wrong" });
  }
}

async function handelLoginUser(req, res) {
  const body = req.body;
  try {
    if (!body?.user_name || !body?.password) {
      return res
        .status(400)
        .json({ msg: "Please Enter Full Login Credentials" });
    }
    const login_details = await WaiterUserTableSchema.findOne(
      {
        user_name: body?.user_name,
        password: body?.password,
      },
      { shopID: 1, user_name: 1, _id: 1 }
    );

    if (!login_details) {
      return res.status(400).json({ msg: "User Not Found" });
    }
    let data = {
      shopID: login_details?.shopID,
      _id: login_details?._id,
      user_name: login_details?.user_name,
    };
    const tokenID = createWaiterToken(data);
    return res.status(200).json({ msg: "Waiter User Token", target: tokenID });
  } catch (error) {
    return res.status(400).json({ msg: "somthing went wrong" });
  }
}

async function waiter_get_tables(req, res) {
  const body = req.body;
  try {
    const existingTable = await shopTableSchema.findOne({
      shopID: body?.authUser?.shopID,
    });
    if (!existingTable) {
      return res.status(200).json({ msg: "No Table Exist" });
    }
    return res
      .status(200)
      .json({ msg: "Tables", target: existingTable?.tables });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function get_categories_waiter(req, res) {
  const body = req.body;
  try {
    const existingCategories = await foodTableSchema.findOne({
      shopID: body?.authUser?.shopID,
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

async function get_menu_food_waiter(req, res) {
  const shopID = req?.body?.authUser?.shopID;
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

async function fetch_order_table_inventories_waiter(req, res) {
  const body = req.body;
  try {
    const order_data = await inventorieTableSchema.findOne({
      _id: body.order_id,
    });
    if (!order_data) {
      return res.status(200).json({ msg: "No order's in this table" });
    }
    return res.status(200).json({ msg: "order details", target: order_data });
  } catch (error) {
    return res.status(200).json({ msg: "somthing went wrong" });
  }
}

async function save_order_waiter(req, res) {
  const body = req?.body;
  console.log("req", req);
  try {
    const isExist = await User.exists({
      _id: body?.authUser?.shopID,
    });
    if (!isExist) {
      return res.status(404).json({ msg: "User Not Found" });
    } else {
      if (body?.order_id) {
        const updatedInventorie = await inventorieTableSchema.findOneAndUpdate(
          { _id: body?.order_id },
          {
            $set: {
              shopID: body?.authUser?.shopID,
              inventories: body?.inventories,
              note: body?.note,
              total: body?.total,
              customer: body?.customer,
              discount: body?.discount,
            },
          },
          { new: true }
        );
        if (!updatedInventorie) {
          return res.status(404).json({ msg: "order details are incorrect" });
        }

        const update = {
          $set: {
            "tables.$[t].table_data.$[i].total": body?.total,
          },
        };
        const arrayFilters = [
          { "t.table_type_id": body?.table_type_id },
          { "i._id": body?.table?.tableID },
        ];
        await shopTableSchema.updateOne(
          {
            shopID: body?.authUser?.shopID,
          },
          update,
          {
            arrayFilters,
          }
        );
        req.io.to(body?.authUser?.shopID).emit("notify_from_waiter",body?.table?.tableID);
        return res
          .status(200)
          .json({ msg: "order updated", order_id: body?.order_id });
      } else {
        const newOrder = new inventorieTableSchema({
          shopID: body?.authUser?.shopID,
          ...body,
        });
        const { _id } = await newOrder.save();

        const update = {
          $set: {
            "tables.$[t].table_data.$[i].orderID": _id,
            "tables.$[t].table_data.$[i].total": body?.total,
          },
        };
        const arrayFilters = [
          { "t.table_type_id": body?.table_type_id },
          { "i._id": body?.table?.tableID },
        ];
        await shopTableSchema.updateOne(
          {
            shopID: body?.authUser?.shopID,
          },
          update,
          {
            arrayFilters,
          }
        );
        req.io.to(body?.authUser?.shopID).emit("notify_from_waiter",body?.table?.tableID);
        return res.status(200).json({ msg: "Order Saved", order_id: _id });
      }
    }
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function is_valid_waiter(req, res) {
  const body = req.body;
  try {
    const isExist = await WaiterUserTableSchema.findOne({
      shopID: body?.authUser?.shopID,
      _id: body?.authUser?._id,
    });
    if (!isExist) {
      return res.status(200).json({ msg: "No Data Found", target: null });
    }
    return res.status(200).json({ msg: "Categories", target: isExist });
  } catch (error) {
    return res.status(400).json({ msg: error });
  }
}

module.exports = {
  getUser,
  handelLoginUser,
  handelCreateUser,
  delete_user_kot,
  waiter_get_tables,
  get_categories_waiter,
  get_menu_food_waiter,
  fetch_order_table_inventories_waiter,
  save_order_waiter,
  is_valid_waiter,
};
