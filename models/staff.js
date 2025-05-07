const mongoose = require("mongoose");

const staffSche = new mongoose.Schema(
  {
    shopID: {
      type: String,
    },
    option: Number,
    staff_details: [
      {
        sname: String,
        phone: String,
        address: Number,
        salary: Number,
        other: String,
        advance_money: Number,
        dateofJoin: Number,
        totalLeave: [String],
        joinDate: {
          type: Date,
          default: function () {
            return new Date();
          },
        },
      },
    ],
  },
  { timestamps: true }
);

const staffSchema = mongoose.model("staffData", staffSche);

module.exports = { staffSchema };
