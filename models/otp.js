const mongoose = require("mongoose");

const otp = new mongoose.Schema(
  {
    shopID: String,
    otp_code: String,
    phone: String,
  },
  { timestamps: false }
);

const otpSchema = mongoose.model("otpTable", otp);

module.exports = { otpSchema };
