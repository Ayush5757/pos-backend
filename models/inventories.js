const mongoose = require("mongoose");

const inventorieTableSche = new mongoose.Schema(
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
        isDelivered: Number
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
    paymentMethod: String,
  },
  { timestamps: true }
);

const inventorieTableSchema = mongoose.model("inventorie", inventorieTableSche);

module.exports = { inventorieTableSchema };
