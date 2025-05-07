const { inventorieTableSchema } = require("../models/inventories");
const { orderInventorieTableSchema } = require("../models/orderInventorie");
const { otpSchema } = require("../models/otp");
const { shopTableSchema } = require("../models/table");
const { User } = require("../models/user");

async function save_new_order_inventorie_customer(req, res) {
  const body = req.body;
  try {
    if(!body?.OTP){
      return res.status(400).json({ msg: "Enter OTP First" });
    }
    const currest_otp = await otpSchema.findOneAndDelete({
      shopID: body.shopID,
      otp_code: body?.OTP,
      phone: body?.customer?.phone
    });
    if (!currest_otp) {
      return res.status(400).json({ msg: "OTP Not Correct" });
    }

    const isExist = await User.exists({
      _id: body?.shopID,
    });
    if (!isExist) {
      return res.status(400).json({ msg: "User Not Found" });
    } else {
      const newOrder = new orderInventorieTableSchema({
        ...body,
      });
      await newOrder.save();
      req.io.to(body?.shopID).emit("newOrderArrived");
      return res.status(200).json({ msg: "Order placed" });
    }
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function save_new_order_inventorie_customer_without_OTP(req, res) {
  const body = req.body;
  try {
    const isExist = await User.exists({
      _id: body?.shopID,
    });
    if (!isExist) {
      return res.status(400).json({ msg: "User Not Found" });
    } else {
      const newOrder = new orderInventorieTableSchema({
        ...body,
      });
      await newOrder.save();
      req.io.to(body?.shopID).emit("newOrderArrived");
      return res.status(200).json({ msg: "Order placed" });
    }
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function save__order_to_existing_inventorie_customer(req, res) {
  const body = req.body;
  try {
    const existingOrder = await orderInventorieTableSchema.findOne({
      "shopID": body?.shopID,
      "customer.phone": body?.customer.phone,
      "table.tableID": body?.table.tableID,
      "table.table_name": body?.table.table_name,
      "table.table_type_id": body?.table.table_type_id
    });

    if (existingOrder) {
      existingOrder.total = body.total;
      existingOrder.inventories.push(...body.inventories);
      await existingOrder.save();
      req.io.to(body?.shopID).emit("newOrderArrived");
      return res.status(200).json({ msg: "Order updated for existing customer" });
    } else {
      const newOrder = new orderInventorieTableSchema({
        ...body,
      });
      await newOrder.save();
      req.io.to(body?.shopID).emit("newOrderArrived");
      return res.status(200).json({ msg: "Order placed" });
    }
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function get_new_order_inventorie_customer(req, res) {
  const body = req.query;
  try {
    const order_data = await orderInventorieTableSchema.find({
      shopID: body?.shopID,
    });
    if (!order_data) {
      return res.status(404).json({ msg: "No data" });
    }

    return res
      .status(200)
      .json({ msg: "New Order Requests", target: order_data });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function chanege_status_and_add_to_inventrie_to_table(req, res) {
  const body = req.body;

  try {
    if (!body.shopID && !body.tableID) {
      return res.status(400).json({ msg: "Missing shopID in the request" });
    }
    const customer_order = await orderInventorieTableSchema.findOneAndDelete({
      shopID: body.shopID,
      "table.tableID": body?.tableID,
      "customer.phone": body?.customer?.phone,
      order_status: 3,
    });

    if (!customer_order) {
      return res.status(400).json({ msg: "No matching order found" });
    }

    const { _id, createdAt, updatedAt, __v, ...orderData } =
      customer_order.toObject();

    const existed_inventorie = await inventorieTableSchema.findOne({
      shopID: body.shopID,
      "table.tableID": body?.tableID,
      "customer.phone": body?.customer?.phone,
    });

    if (existed_inventorie) {
      existed_inventorie.inventories = [
        ...orderData?.inventories,
        ...existed_inventorie.inventories,
      ];

      existed_inventorie.total = orderData?.total + ((orderData?.total * 18) / 100);
      if(existed_inventorie?.discount){
        existed_inventorie.total =  existed_inventorie?.total - existed_inventorie?.discount;
      }
      if(existed_inventorie?.addOnCharges?.length>0){
        const totalChargePrice = existed_inventorie?.addOnCharges?.reduce(
          (total, charge) => total + charge.charge_price,
          0
        );
        existed_inventorie.total =  existed_inventorie.total + totalChargePrice
      }
      let total_rupes = existed_inventorie.total
      await existed_inventorie.save();

      const update = {
        $set: {
          "tables.$[t].table_data.$[i].total": total_rupes,
        },
      };
      const arrayFilters = [
        { "t.table_type_id": body?.table_type_id },
        { "i._id": body?.tableID },
      ];
      await shopTableSchema.updateOne(
        {
          shopID: body?.shopID,
        },
        update,
        {
          arrayFilters,
        }
      );
      return res
        .status(200)
        .json({ msg: "Order Updated, Shifted to inventory", target: orderData });
    }

    orderData.order_status = 1;
    const inventories = new inventorieTableSchema({ ...orderData });
    const new_order = await inventories.save();
    const update = {
      $set: {
        "tables.$[t].table_data.$[i].orderID": new_order?._id,
        "tables.$[t].table_data.$[i].total": new_order?.total + ((new_order?.total * 18) / 100),
      },
    };
    const arrayFilters = [
      { "t.table_type_id": body?.table_type_id },
      { "i._id": body?.tableID },
    ];
    await shopTableSchema.updateOne(
      {
        shopID: body?.shopID,
      },
      update,
      {
        arrayFilters,
      }
    );

    return res
      .status(200)
      .json({ msg: "Order Accepted, Shifted to inventory", target: {...orderData,order_id:new_order?._id} });
  } catch (error) {
    return res.status(400).json({ msg: "Something went wrong" });
  }
}


async function delete_status_and_add_to_inventrie_to_table(req, res) {
  const body = req.body;

  try {
    if (!body.shopID && !body.tableID) {
      return res.status(400).json({ msg: "Missing shopID in the request" });
    }
    const customer_order = await orderInventorieTableSchema.findOneAndDelete({
      shopID: body.shopID,
      "table.tableID": body?.tableID,
      "customer.phone": body?.customer?.phone,
      order_status: 3,
    });

    if (!customer_order) {
      return res.status(200).json({ msg: "No matching order found" });
    }

    return res
      .status(200)
      .json({ msg: "Order Deleted" });
  } catch (error) {
    return res.status(400).json({ msg: "Something went wrong" });
  }
}


async function otp_sender(req, res) {
  const body = req?.body;
  try {
    const genereate_otp = Math.floor(1000 + Math.random() * 9000);
    fetch(
      `https://www.fast2sms.com/dev/bulkV2?authorization=Us7bfRovWwrjo0JXzON4ZAAlbRhXZtEVlCHgUiBVcZpAwoeaWHeB8lrKOIHG&route=otp&variables_values=${genereate_otp}&flash=0&numbers=${body?.phone}`
    )
      .then((response) => {
        if (!response.ok) {
          return res.status(400).json({ msg: 'failed' });
        }
        return response.json();
      })
      .then(async() => {
        const OTP_SCHEMA = new otpSchema({
          shopID: body?.shop_id,
          phone: body?.phone,
          otp_code: genereate_otp,
        });
        await OTP_SCHEMA.save();
        return res.status(200).json({ msg: 'Successfully Send OTP' });
      })
      .catch(() => {
        return res.status(400).json({ msg: 'Somthing Went Wrong' });
      });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

module.exports = {
  save_new_order_inventorie_customer: save_new_order_inventorie_customer,
  get_new_order_inventorie_customer: get_new_order_inventorie_customer,
  chanege_status_and_add_to_inventrie_to_table:
    chanege_status_and_add_to_inventrie_to_table,
  save__order_to_existing_inventorie_customer:
    save__order_to_existing_inventorie_customer,
  otp_sender: otp_sender,
  delete_status_and_add_to_inventrie_to_table:delete_status_and_add_to_inventrie_to_table,
  save_new_order_inventorie_customer_without_OTP:save_new_order_inventorie_customer_without_OTP
};
