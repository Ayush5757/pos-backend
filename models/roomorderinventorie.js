const mongoose = require("mongoose");

const roomorderInventorieTableSche = new mongoose.Schema(
  {
    shopID: {
      type: String,
    },
    room: {
      roomID: String,
      room_name: String,
      room_type_id: String,
    },
    customer: {
      name: String,
      address: String,  
      phone: String,
    },
    inventories: [
      {
        item_name: String,
        item_id: String,
        qty: Number,
        price: Number,
        half_price: Number,
        plate_type: String,
      },
    ],
    note: String,
    total: Number,
    order_status: Number
  },
  { timestamps: true }
);

const roomorderInventorieTableSchema = mongoose.model("roomorderInventorie", roomorderInventorieTableSche);

module.exports = { roomorderInventorieTableSchema };
