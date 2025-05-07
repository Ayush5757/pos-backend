const mongoose = require("mongoose");

const orderInventorieTableSche = new mongoose.Schema(
  {
    shopID: {
      type: String,
    },
    table: {
      tableID: String,
      table_name: String,
      table_type_id: String,
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

const orderInventorieTableSchema = mongoose.model("orderInventorie", orderInventorieTableSche);

module.exports = { orderInventorieTableSchema };
