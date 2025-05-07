const mongoose = require("mongoose");

const commentSche = new mongoose.Schema(
  {
    shopID: String,
    comment: String,
    name: String,
    phone: Number,
    rating: Number
  },
  { timestamps: true }
);

const commentSchema = mongoose.model("comment", commentSche);

module.exports = { commentSchema };
