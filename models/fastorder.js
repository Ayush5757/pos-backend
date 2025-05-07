const mongoose = require("mongoose");

const fastOrderSche = new mongoose.Schema(
  {
    shopID: {
      type: String,
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
    addOnCharges: [
      {
        charge_name: String,
        charge_price: Number
      },
    ],
    note: String,
    total: Number,
    order_status: Number,
    discount : Number,
    onlineOrder: {
      type: Number,
      default: 0
    },
    paymentMethod: String,
  },
  { timestamps: true }
);

const fastOrderSchema = mongoose.model("fastOrder", fastOrderSche);

module.exports = { fastOrderSchema };
