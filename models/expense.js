const mongoose = require("mongoose");

const expenseSche = new mongoose.Schema(
  {
    shopID: {
      type: String,
    },
    month: Number,
    year: Number,
    month_total_expense: Number,
    expense_list: [
      {
        ex_name: String,
        ex_type: Number,
        qty: Number,
        price: Number
      }
    ]

  },
  { timestamps: true }
);

const expenseSchema = mongoose.model("expense", expenseSche);

module.exports = { expenseSchema };
