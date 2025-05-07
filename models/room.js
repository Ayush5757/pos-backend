const mongoose = require("mongoose");

const shopRoomSche = new mongoose.Schema(
  {
    shopID: {
      type: String,
    },
    isOTPBook:{
      type: Number,
      default: 0
    },
    roomTypes: [
      {
          roomTypeName: {
            type: String,
            required: false
          },
      }
    ],
    rooms: [
      {
        room_type: String,
        room_type_id: String,
        room_data:[
          {
            name: String,
            orderID: String,
            total: Number,
            workingRoom: {
              type: Number,
              default: 1
            }
          }
        ]       
      },
    ],
  },
  { timestamps: true }
);

const shopRoomSchema = mongoose.model("room", shopRoomSche);

module.exports = { shopRoomSchema };
