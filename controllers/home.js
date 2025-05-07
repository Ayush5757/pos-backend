const { homeSchema } = require("../models/home");

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


async function send_home_contact_us(req, res) {
  const body = req.body;
  try {
    const newExpanse = new homeSchema({
      ...body,
    });
    await newExpanse.save();
    return res.status(200).json({ msg: "Message Received" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

module.exports = {
  send_home_contact_us,
};

async function get_home_pictures_URL(req, res) {
  try {
    let photos = ['expense.PNG','FastOrderList.PNG','inventorie.PNG','menu-management.PNG','OnlineOrderAccept.PNG','Orderhistory.PNG','Tables_images.PNG','menu_img.jpg','banner_chaumin.jpg','bills.jpg']

    const updatedData = [];

    for (const photo of photos) {
      let foodPhotoURL = null;
      if (photo) {
        const mainFoodGetObjectParams = {
          Bucket: bucketName,
          Key: photo,
        };
        const mainFoodCommand = new GetObjectCommand(mainFoodGetObjectParams);
        foodPhotoURL = await getSignedUrl(s3, mainFoodCommand, {
          expiresIn: 10800,
        });
      }
      updatedData.push({
        photo: photo,
        photoURL: foodPhotoURL,
      });
    }    
    return res.status(200).json({ msg: "Home Photos",target:updatedData });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

module.exports = {
  send_home_contact_us,
  get_home_pictures_URL
};
