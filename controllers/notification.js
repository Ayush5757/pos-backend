const { inventorieTableSchema } = require("../models/inventories");
const { orderInventorieTableSchema } = require("../models/orderInventorie");
const { shopTableSchema } = require("../models/table");

async function fetch_is_table_booked(req, res) {
  const body = req.query;
  try {
    const shoptable = await shopTableSchema.findOne({
      shopID: body?.shopID,
    });
    if (shoptable) {
      const matchingtable = shoptable.tables.find(
        (table) => table.table_type_id === body?.tableTypeID
      );
      if (matchingtable) {
        const matchingtableData = matchingtable.table_data.find(
          (tableData) =>
            tableData._id.equals(body?.tableID) &&
            tableData.name === body?.tableName
        );
        if (matchingtableData) {
          if (matchingtableData?.orderID) {
            return res
              .status(200)
              .json({
                msg: "This table is Booked Right Now Pls Wait",
                isBooked: true,
              });
          }
          if(matchingtableData?.workingTable === 1){
            return res
              .status(200)
              .json({ msg: "No order's in this table", isBooked: false, isOTPBook:shoptable?.isOTPBook});
          }
        }
      }
    }
    return res
      .status(200)
      .json({ msg: "Invalid Data", isBooked: true });
  } catch (error) {
    return res.status(200).json({ msg: "somthing went wrong" });
  }
}

async function fetch_latest_shop_orders(req, res) {
  const body = req.query;
  try {
    if (!body.shopID) {
      return res.status(400).json({ msg: "Missing shopID in the request" });
    }

    const result = await inventorieTableSchema.find({
      shopID: body.shopID,
      order_status: 3,
    });

    if (result.length === 0) {
      return res.status(200).json({ msg: "No Orders", target: [] });
    }

    return res.status(200).json({ msg: "Pending Orders", target: result });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(400).json({ msg: "Something went wrong" });
  }
}



async function get_already_booked_table_data(req, res) {
  const body = req.body;
  try {
    if (!body.shopID && !body.tableID && !body.customer) {
      return res.status(400).json({ msg: "Missing shopID in the request" });
    }

    const result = await inventorieTableSchema.findOne({
      shopID: body.shopID,
      "table.tableID": body?.tableID,
      "customer.phone": body?.customer?.phone,
    },{inventories:1,total:1,discount:1,addOnCharges:1});
    if (!result) {
      return res.status(200).json({ msg: "No Ordered Items ", target: [] });
    }

    return res.status(200).json({ msg: "Confirm Ordered Items", target: result});
  } catch (error) {
    return res.status(400).json({ msg: "Something went wrong" });
  }
}

async function get_pending_booked_table_data(req, res) {
  const body = req.body;
  try {
    if (!body.shopID && !body.tableID && !body.customer) {
      return res.status(400).json({ msg: "Missing shopID in the request" });
    }

    const result = await orderInventorieTableSchema.findOne({
      shopID: body.shopID,
      "table.tableID": body?.tableID,
      "customer.phone": body?.customer?.phone,
    },{inventories:1,total:1});
    if (!result) {
      return res.status(200).json({ msg: "No Ordered Items ", target: [] });
    }

    return res.status(200).json({ msg: "Confirm Ordered Items", target: result});
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(400).json({ msg: "Something went wrong" });
  }
}
module.exports = {
  fetch_is_table_booked,
  fetch_latest_shop_orders,
  get_already_booked_table_data,
  get_pending_booked_table_data
};
