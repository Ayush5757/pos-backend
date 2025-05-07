const { createToken } = require("../constants/auth");
const { User } = require("../models/user");
const bcrypt = require("bcryptjs");

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

async function handelGetAllUsers(req, res) {
  const allUsers = await User.find({});
  return res.json({ AllUSers: allUsers });
}

async function handelCreateUser(req, res) {
  const body = req.body;
  try {
    if (!body?.shopEmail || !body?.shopPassword || !body?.shopName) {
      return res.status(400).json({ msg: "Enter The Full Details" });
    }
    const isUserExist = await User.findOne({ shopEmail: body?.shopEmail });
    if (isUserExist) {
      return res.status(400).json({ msg: "User Already Exist" });
    }
    const passwordHash = await bcrypt.hash(body?.shopPassword, 10);
    if (passwordHash) {
      const createdUser = await User.create({
        shopName: body?.shopName,
        shopEmail: body?.shopEmail,
        shopPassword: passwordHash,
      });
      return res
        .status(200)
        .json({ msg: "New User Created", user: createdUser });
    }
    return res.status(200).json({ msg: "Can Not Create User" });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
}

async function handelLoginUser(req, res) {
  const { shopEmail, shopPassword} = req.body;
  try {
    if (!shopEmail || !shopPassword) {
      return res.status(400).json({ msg: "Please Enter All Details" });
    }
    const LoginUser = await User.findOne({ shopEmail: shopEmail });

    if (!LoginUser) {
      return res.status(400).json({ msg: "User Not Found" });
    }
    const passwordMatch = await bcrypt.compare(
      shopPassword,
      LoginUser?.shopPassword
    );
    if (!passwordMatch) {
      return res.status(400).json({ msg: "Information Not Matched" });
    }
    const tokenID = createToken({
      _id: LoginUser._id,
      shopEmail: LoginUser.shopEmail,
    });
    if (!tokenID) {
      return res.status(400).json({ msg: "User Not Found" });
    }
    return res
      .status(200)
      .json({ msg: "Login User", user: LoginUser, token: tokenID });
  } catch (error) {
    return res.status(400).json({ msg: "InterNet Problem" });
  }
}

async function handelGoogleLoginUser(req, res) {
  const { email,emailVerified,id } = req.body;
  try {
    if (!emailVerified || !email || !id) {
      return res.status(400).json({ msg: "Please Enter All Details" });
    }
    const LoginUser = await User.findOne({ shopEmail: email });

    if (!LoginUser) {
      return res.status(400).json({ msg: "User Not Found" });
    }
  
    const tokenID = createToken({
      _id: LoginUser._id,
      shopEmail: LoginUser.shopEmail,
    });
    if (!tokenID) {
      return res.status(400).json({ msg: "User Not Found" });
    }
    return res
      .status(200)
      .json({ msg: "Login User", user: LoginUser, token: tokenID });
  } catch (error) {
    return res.status(400).json({ msg: "InterNet Problem" });
  }
}


async function handel_get_user_form(req, res) {
  const { authUser } = req.body;
  try {
    const userForm1 = await User.find({ shopEmail: authUser?.shopEmail });
    return res
      .status(200)
      .json({ msg: "Form 1 details fetched", userForm1: userForm1 });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
}

async function handel_get_user_image_envalop(req, res) {
  const { authUser } = req.body;
  try {
    const user = await User.find({ shopEmail: authUser?.shopEmail });
    const updatedPaginatedData = [];
    for (const data of user[0]?.banner_image) {
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
        photo: data?.photo,
        photoURL: foodPhotoURL,
        _id: data?._id,
      });
    }

    const updatedPaginatedData2 = [];
    for (const data of user[0]?.menu_instance_image) {
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
      updatedPaginatedData2.push({
        photo: data?.photo,
        photoURL: foodPhotoURL,
        _id: data?._id,
      });
    }

    return res.status(200).json({
      msg: "user other images",
      banner_image: updatedPaginatedData,
      menu_instance_image: updatedPaginatedData2,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handelForm1User(req, res) {
  const {
    shopName,
    address,
    phone,
    alt_phone,
    about,
    authUser,
    pincode,
    city,
    gstin,
  } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { shopEmail: authUser?.shopEmail },
      {
        $set: {
          address: address,
          phone: phone,
          alt_phone: alt_phone,
          about: about,
          shopName: shopName,
          pincode: pincode,
          city: city,
          gstin: gstin,
        },
      },
      { new: true }
    );
    return res.json({ msg: "shop details updated 1", user: user });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
}

async function handelForm2User(req, res) {
  const {
    shop_google_address,
    start_time,
    day_offs,
    end_time,
    extra_time_info,
    waths_app_number,
    authUser,
  } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { shopEmail: authUser?.shopEmail },
      {
        $set: {
          shop_google_address: shop_google_address,
          start_time: start_time,
          end_time: end_time,
          day_offs: day_offs,
          extra_time_info: extra_time_info,
          waths_app_number: waths_app_number,
        },
      },
      { new: true }
    );
    return res.json({ msg: "shop details updated 2", user: user });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
}

async function handelBanner(req, res) {
  try {
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
    if (tempName) {
      const user = await User.findOneAndUpdate(
        { _id: req.body?.shopID },
        {
          $push: {
            banner_image: { photo: tempName },
          },
        },
        { new: true }
      );
      if (!user) {
        return res.status(400).json({ msg: "failed to update image" });
      }
      return res.status(200).json({ msg: "Shop banner Image updated" });
    }
    return res.status(200).json({ msg: "Image Not Found" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function handelMenuInstanceImages(req, res) {
  try {
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
    if (tempName) {
      const user = await User.findOneAndUpdate(
        { _id: req.body?.shopID },
        {
          $push: {
            menu_instance_image: { photo: tempName },
          },
        },
        { new: true }
      );
      if (!user) {
        return res.status(400).json({ msg: "failed to update image" });
      }
    }
    return res.json({ msg: "Shop menu instance Image updated" });
  } catch (error) {
    return res.status(400).json({ error: error });
  }
}

async function handelDeleteOtherImagesMenu(req, res) {
  const { authUser, image_id } = req.body;
  try {
    const filter = { shopEmail: authUser?.shopEmail };
    const update = { $pull: { menu_instance_image: { _id: image_id } } };

    const result = await User.findOneAndUpdate(filter, update, { new: true });

    if (!result) {
      return res.status(200).json({ message: "Problem With Removing" });
    }
    if(req?.body?.photo){
      const params = { Bucket: bucketName, Key: req?.body?.photo };
      const command = new DeleteObjectCommand(params);
      await s3.send(command);
    }
    return res.status(200).json({ message: "Item Removed Successfully" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function handelDeleteOtherImagesBanner(req, res) {
  const { authUser, image_id } = req.body;
  try {
    const filter = { shopEmail: authUser?.shopEmail };
    const update = { $pull: { banner_image: { _id: image_id } } };

    const result = await User.findOneAndUpdate(filter, update, { new: true });

    if (!result) {
      return res.status(200).json({ message: "Problem With Removing" });
    }
    if(req?.body?.photo){
      const params = { Bucket: bucketName, Key: req?.body?.photo };
      const command = new DeleteObjectCommand(params);
      await s3.send(command);
    }
    return res.status(200).json({ message: "Item Removed Successfully" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function handelShopStatus(req, res) {
  const { authUser, checking } = req.body;
  console.log("req", req.body);
  try {
    const filter = { shopEmail: authUser?.shopEmail };
    const update = { $set: { status: checking } };

    const result = await User.findOneAndUpdate(filter, update, { new: true });

    if (!result) {
      return res.status(200).json({ message: "failed to update status" });
    }
    return res.status(200).json({ message: "status updated" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function barcode_add(req, res) {
  try {
    const { authUser, checking } = req.body;
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
    if (tempName) {
      const user = await User.findOneAndUpdate(
        { _id: req.body?.shopID },
        {
          $push: {
            barcode_instance_image: { photo: tempName },
          },
        },
        { new: true }
      );
      if (!user) {
        return res.status(400).json({ msg: "failed to add barcode image" });
      }
    }
    return res.json({ msg: "BarCode Added" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}


async function handel_get_user_barcode(req, res) {
  const { authUser } = req.body;
  try {
    const user = await User.findOne({ _id: authUser?._id });
    const updatedData = [];
    for (const data of user?.barcode_instance_image) {
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
      updatedData.push({
        photo: data?.photo,
        photoURL: foodPhotoURL,
        _id: data?._id,
      });
    }
    return res.status(200).json({
      msg: "user barcode",
      target: updatedData,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}


async function handel_delete_barcode(req, res) {
  const { authUser } = req.body;
  try {
    const filter = { _id: authUser?._id };
    const update = { $pull: { barcode_instance_image: { _id: req?.body?._id } } };

    const result = await User.findOneAndUpdate(filter, update, { new: true });

    if (!result) {
      return res.status(200).json({ message: "Problem With Removing" });
    }
    if(req?.body?.photo){
      const params = { Bucket: bucketName, Key: req?.body?.photo };
      const command = new DeleteObjectCommand(params);
      await s3.send(command);
    }
    return res.status(200).json({
      msg: "BarCode Deleted",
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  handelGetAllUsers,
  handelCreateUser,
  handelLoginUser,
  handelForm1User,
  handelForm2User,
  handel_get_user_form,
  handelBanner,
  handelMenuInstanceImages,
  handel_get_user_image_envalop,
  handelDeleteOtherImagesMenu,
  handelDeleteOtherImagesBanner,
  handelShopStatus,
  barcode_add,
  handel_get_user_barcode,
  handel_delete_barcode,
  handelGoogleLoginUser
};
