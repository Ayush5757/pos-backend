const mongoose = require("mongoose");

const menuTableSche = new mongoose.Schema(
  {
    shopID: {
      type: String,
    },
    food_data: [
      {
        item_name: String,
        price: Number,
        half_price: Number,
        offer_price: Number,
        offer_half_price: Number,
        desc: String,
        photo: String,
        cat_id: String,
      },
    ],
  },
  { timestamps: true }
);

const menuTableSchema = mongoose.model("menu", menuTableSche);

module.exports = { menuTableSchema };
