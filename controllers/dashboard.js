const { expenseSchema } = require("../models/expense");
const { orderchartTableSchema } = require("../models/orderchart");
const { staffSchema } = require("../models/staff");

async function getEexpenses_and_sales_by_month(req, res) {
  const body = req.query;
  try {
    const expense_list_of_month = await expenseSchema.findOne({
      shopID: req?.body?.authUser?._id,
      month: body?.month,
      year: body?.year,
    });

    if (!expense_list_of_month) {
      return res
        .status(200)
        .json({
          msg: "No expenses in this month",
          target: { sales: 0, expenses: 0 },
        });
    }
    const aggregationPipeline = [
      {
        $match: {
          shopID: req?.body?.authUser?._id,
          $expr: {
            $eq: [{ $year: { $toDate: "$createdAt" } }, parseInt(body?.year)],
            $eq: [{ $month: { $toDate: "$createdAt" } }, parseInt(body?.month)],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ];
    const result = await orderchartTableSchema.aggregate(aggregationPipeline);

    if (body?.isincludeStaffSalary && parseInt(body?.isincludeStaffSalary)) {
      const aggregationPipeline2 = [
        {
          $match: {
            shopID: req?.body?.authUser?._id,
          },
        },
        {
          $unwind: "$staff_details",
        },
        {
          $group: {
            _id: null,
            totalSalary: { $sum: "$staff_details.salary" },
          },
        },
      ];
      const staffresult = await staffSchema.aggregate(aggregationPipeline2);
      return res.status(200).json({
        target: {
          sales: result[0]?.total ?? 0,
          expenses: expense_list_of_month?.month_total_expense ?? 0,
          staffresult: staffresult[0]?.totalSalary?? 0,
        },
      });
    }
    return res.status(200).json({
      target: {
        sales: result[0]?.total ?? 0,
        expenses: expense_list_of_month?.month_total_expense ?? 0,
      },
    });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

module.exports = {
  getEexpenses_and_sales_by_month,
};
