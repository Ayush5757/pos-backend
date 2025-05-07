const { expenseSchema } = require("../models/expense");

async function add_expense(req, res) {
  const body = req.body;
  try {
    const existing_shop_expense_month = await expenseSchema.findOne({
      shopID: body?.shopID,
      month: body?.month,
      year: body?.year,
    });

    if (!existing_shop_expense_month) {
      body["month"] = body?.month;
      body["year"] = body?.year;
      body["month_total_expense"] =
        body?.expense_list[0]?.price * body?.expense_list[0]?.qty ?? 0;
      const newExpanse = new expenseSchema({
        ...body,
      });
      await newExpanse.save();
      return res.status(200).json({ msg: "expense created" });
    } else {
      existing_shop_expense_month.month_total_expense =
        existing_shop_expense_month?.month_total_expense +
        body?.expense_list[0]?.price * body?.expense_list[0]?.qty;
      existing_shop_expense_month.expense_list.push(body?.expense_list[0]);
      await existing_shop_expense_month.save();
      return res.status(200).json({ msg: "expense added" });
    }
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function deleteExpense(req, res) {
  const body = req.body;
  try {
    const expense = await expenseSchema.findOne({
      shopID: body?.authUser?._id,
      month: body?.month,
      year: body?.year,
    });

    if (!expense) {
      return res.status(200).json({ msg: "Expense Not Found" });
    }

    // Find the index of the expense item with the provided _id
    const expenseIndex = expense.expense_list.findIndex((item) => item._id?.equals(body.expense_id));

    if (expenseIndex === -1) {
      return res.status(200).json({ msg: "Expense Item Not Found" });
    }

    // Get the deleted expense item to calculate the expense amount
    const deletedExpense = expense.expense_list[expenseIndex];
    const deletedExpenseAmount = deletedExpense.price * deletedExpense.qty;

    // Deduct the deleted expense from month_total_expense
    expense.month_total_expense -= deletedExpenseAmount;

    // Remove the expense item from the array
    expense.expense_list.splice(expenseIndex, 1);

    await expense.save();

    return res.status(200).json({ msg: "Expense removed" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function getEexpenses_by_month(req, res) {
  const { shop_ID, month, year, page = 1, limit = 20 } = req.query;

  try {
    const expenseDocument1 = await expenseSchema.findOne(
      { shopID: shop_ID, month: month, year: year }
    );
    const expenseDocument = await expenseSchema.findOne(
      { shopID: shop_ID, month: month, year: year },
      { expense_list: { $slice: [(page - 1) * limit, limit] } }
    );

    if (!expenseDocument || !expenseDocument.expense_list.length) {
      return res.status(200).json({ msg: "No expenses in this month" });
    }

    const totalExpenses = expenseDocument1.expense_list.length;
    const totalPages = Math.ceil(totalExpenses / limit);

    return res.status(200).json({
      msg: "Expense list",
      target: expenseDocument.expense_list,
      month_total: expenseDocument1?.month_total_expense,
      pageInfo: {
        totalItems: totalExpenses,
        totalPages,
        currentPage: parseInt(page) || 1,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function getExpense_Name(req, res) {
  const body = req.query;

  try {
    const regex = new RegExp(body?.expName, "i");

    const result = await expenseSchema.aggregate([
      {
        $match: {
          shopID: body?.shop_ID,
          "expense_list.ex_name": { $regex: regex },
        },
      },
      {
        $project: {
          _id: 0,
          shopID: 1,
          month: 1,
          year: 1,
          month_total_expense: 1,
          expense_list: {
            $filter: {
              input: "$expense_list",
              as: "expense",
              cond: {
                $regexMatch: { input: "$$expense.ex_name", regex: regex },
              },
            },
          },
        },
      },
    ]);

    if (result.length > 0) {
      return res
        .status(200)
        .json({ msg: "Expense Name Found", target: result[0] });
    } else {
      return res
        .status(200)
        .json({ msg: "No Similar Data Found", target: null });
    }
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
}
module.exports = {
  add_expense,
  getEexpenses_by_month,
  getExpense_Name,
  deleteExpense,
};
