const mongoose = require("mongoose");

const shopRoomImageSche = new mongoose.Schema(
  {
    shopID: {
      type: String,
    },
    title:{
      type: String
    },

    rooms: [{
      roomName: String,
      roomPrice: String,
      roomFirstPic: String,
      additionalPic: String,
      about: String,
    }],
  }
);

const shopRoomImageSchema = mongoose.model("roomimage", shopRoomImageSche);

module.exports = { shopRoomImageSchema };
