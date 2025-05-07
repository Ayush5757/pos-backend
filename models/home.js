const mongoose = require("mongoose");

const homeSche = new mongoose.Schema(
  {
    person_name: String,
    phone: Number,
    city: String,
    state: String,
    message: String,
  },
  { timestamps: true }
);

const homeSchema = mongoose.model("home", homeSche);

module.exports = { homeSchema };
