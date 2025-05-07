const mongoose = require("mongoose");

const kotUserTableSche = new mongoose.Schema(
  {
    shopID: {
      type: String,
    },
    user_name: String,
    password: String,
    inventorie_id: [String],
    roominventorie_id: [String],
    fastorder_inventorie_id: [String],
  },
  { timestamps: true }
);

const kotUserTableSchema = mongoose.model("kotUser", kotUserTableSche);

module.exports = { kotUserTableSchema };
