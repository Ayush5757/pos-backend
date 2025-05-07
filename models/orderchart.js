const mongoose = require("mongoose");

const orderchartTableSche = new mongoose.Schema(
  {
    shopID: {
      type: String,
    },
    table: {
      tableID: String,
      table_name: String,
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
    onlineOrder: Number,
    paymentMethod: String,
  },
  { timestamps: true }
);

const orderchartTableSchema = mongoose.model("orderchart", orderchartTableSche);

module.exports = { orderchartTableSchema };
