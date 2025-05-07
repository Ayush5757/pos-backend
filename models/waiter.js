const mongoose = require("mongoose");

const WaiterUserTableSche = new mongoose.Schema(
  {
    shopID: String,
    user_name: String,
    password: String
  },
  { timestamps: true }
);

const WaiterUserTableSchema = mongoose.model("WaiterUser", WaiterUserTableSche);

module.exports = { WaiterUserTableSchema };
