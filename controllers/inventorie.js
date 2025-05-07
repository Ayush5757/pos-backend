const { fastOrderSchema } = require("../models/fastorder");
const { inventorieTableSchema } = require("../models/inventories");
const { kotUserTableSchema } = require("../models/kotuser");
const { orderchartTableSchema } = require("../models/orderchart");
const { shopTableSchema } = require("../models/table");
const { User } = require("../models/user");

async function save_order(req, res) {
  const body = req.body;
  try {
    const isExist = await User.exists({
      _id: body?.shopID,
    });
    if (!isExist) {
      return res.status(404).json({ msg: "User Not Found" });
    } else {
      if (body?.order_id) {
        const updatedInventorie = await inventorieTableSchema.findOneAndUpdate(
          { _id: body?.order_id },
          {
            $set: {
              inventories: body?.inventories,
              note: body?.note,
              total: body?.total,
              customer: body?.customer,
              discount: body?.discount,
              addOnCharges: body?.addOnCharges,
              paymentMethod: body?.paymentMethod 
            },
          },
          { new: true }
        );
        if (!updatedInventorie) {
          return res.status(404).json({ msg: "order details are incorrect" });
        }

        const update = {
          $set: {
            "tables.$[t].table_data.$[i].total": body?.total,
          },
        };
        const arrayFilters = [
          { "t.table_type_id": body?.table_type_id },
          { "i._id": body?.table?.tableID },
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
          .json({ msg: "order updated", order_id: body?.order_id });
      } else {
        const newOrder = new inventorieTableSchema({
          ...body,
        });
        const { _id } = await newOrder.save();

        const update = {
          $set: {
            "tables.$[t].table_data.$[i].orderID": _id,
            "tables.$[t].table_data.$[i].total": body?.total,
          },
        };
        const arrayFilters = [
          { "t.table_type_id": body?.table_type_id },
          { "i._id": body?.table?.tableID },
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
        return res.status(200).json({ msg: "Order Saved", order_id: _id });
      }
    }
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function fetch_order_table_inventories(req, res) {
  console.log('again called');
  const body = req.body;
  try {
    const order_data = await inventorieTableSchema.findOne({
      _id: body.order_id,
    });
    if (!order_data) {
      return res.status(200).json({ msg: "No order's in this table" });
    }
    return res.status(200).json({ msg: "order details", target: order_data });
  } catch (error) {
    return res.status(200).json({ msg: "somthing went wrong" });
  }
}

async function confirm_order(req, res) {
  const body = req.body;
  try {
    const inventorieToMove = await inventorieTableSchema.findById(
      body?.order_id
    );
    if (!inventorieToMove) {
      return res.status(404).json({ msg: "Inventory not found" });
    }
    const orderChart = new orderchartTableSchema({
      ...inventorieToMove.toObject(),
    });
    await orderChart.save();
    const isDeleted = await inventorieTableSchema.findByIdAndDelete(
      body?.order_id
    );

    if (!orderChart || !isDeleted) {
      return res.status(400).json({
        msg: "Confirm Failed - Unable to create order or delete inventory",
      });
    }

    const update = {
      $set: {
        "tables.$[t].table_data.$[i].orderID": null,
        "tables.$[t].table_data.$[i].total": 0,
      },
    };
    const arrayFilters = [
      { "t.table_type_id": body?.table_type_id },
      { "i._id": body?.table_id },
    ];
    await shopTableSchema.updateOne(
      {
        shopID: body?.shop_id,
      },
      update,
      {
        arrayFilters,
      }
    );

    const updatedKotUser = await kotUserTableSchema.findOneAndUpdate(
      { shopID: body?.shop_id },
      { $pull: { inventorie_id: body?.order_id } },
      { new: true }
    );
    if (!updatedKotUser) {
      return res.status(200).json({ msg: "Kot User Not Exist" });
    }
    try {
      const roomName = `kot_${body?.authUser?._id}`;
      if (req.io.sockets.adapter.rooms.has(roomName)) {
        req.io.to(roomName).emit("kot_Order_status_changed");
      }
    } catch (error) {
      return res.status(200).json({ msg: "Fast Order Completed" });
    }
    return res.status(200).json({ msg: "Order Confirmed" });
  } catch (error) {
    return res.status(400).json({ msg: "somthing went wrong" });
  }
}

// ---------------------------------------------------------------------- customer Order

async function customer_save_inventorie(req, res) {
  const body = req.body;
  console.log("body", body);
  try {
    const isExist = await User.exists({
      _id: body?.shopID,
    });
    console.log("isExist", isExist);
    if (!isExist) {
      return res.status(404).json({ msg: "User Not Found" });
    } else {
      const result = await inventorieTableSchema.findOne({
        shopID: body?.shopID,
        "table.tableID": body?.table?.tableID,
      });

      console.log("result", result);
      if (result) {
        if (result?.customer?.phone == body?.customer?.phone) {
          result.inventories = [...body?.inventories, ...result?.inventories];
          await result.save();
          return res
            .status(200)
            .json({ msg: "Order updated", isBooked: false });
        }
        console.log("ayush3");
        return res
          .status(200)
          .json({ msg: "Order is Already in this Table", isBooked: true });
      }
      const newOrder = new inventorieTableSchema({
        ...body,
      });
      await newOrder.save();

      return res
        .status(200)
        .json({ msg: "Customer Order Placed", isBooked: false });
    }
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

// ----------------------------- fast inventorie

async function complete_fast_inventorie(req, res) {
  const body = req.body;
  try {
    const isExist = await User.exists({
      _id: body?.authUser?._id,
    });
    if (!isExist) {
      return res.status(404).json({ msg: "User Not Found" });
    } else {
      const orderChart = new orderchartTableSchema({
        ...body,
      });
      await orderChart.save();
      return res.status(200).json({ msg: "Fast Order Complete" });
    }
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function save_fast_inventorie(req, res) {
  const body = req?.body;
  try {
      const existingFastOrders = await fastOrderSchema.findOneAndUpdate({
        shopID : body?.authUser?._id,
        _id : body?._id
      }, 
      { $set: { shopID: body?.shopID,
        customer: body?.customer,
        inventories: body?.inventories,
        note: body?.note,
        total: body?.total,
        order_status: body?.order_status,
        onlineOrder: body?.onlineOrder,
        discount: body?.discount,
        addOnCharges: body?.addOnCharges,        
      }},
      { new: true })

      if(existingFastOrders){
        return res.status(200).json({ msg: "Fast Order Updated",target: existingFastOrders });
      }
      const orderChart = new fastOrderSchema({
        ...body,
      });
      await orderChart.save();
      return res.status(200).json({ msg: "Fast Order Saved",target:orderChart });

  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function get_fast_orders_inventorie_list(req, res) {
  const body = req?.body;
  try {
    const isExist = await User.exists({
      _id: body?.authUser?._id,
    });
    if (!isExist) {
      return res.status(404).json({ msg: "User Not Found" });
    }
    const existingFastOrders = await fastOrderSchema.find({
      shopID : body?.authUser?._id,
    })
    if(!existingFastOrders){
      return res.status(200).json({ msg: "Data Not Found with This Shop" });
    }
    return res.status(200).json({ msg: "Fast Order List",target: existingFastOrders });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}
async function cancel_fast_orders_inventorie(req, res) {
  const body = req?.body;
  console.log('body',body);
  try {
    const existingFastOrders = await fastOrderSchema.findOneAndDelete({
      _id: body?.order_id,
      shopID : body?.authUser?._id,
    })
    if(!existingFastOrders){
      return res.status(200).json({ msg: "Data Not Found with This Shop" });
    }
    req.io
    .to(`kot_${body?.authUser?._id}`)
    .emit("kot_Order_status_changed");
    return res.status(200).json({ msg: "Fast Order Deleted"});
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}
async function completeFastOrdersInventory(req, res) {
  const body = req?.body;
  console.log('body',body);
  try {
    const existingFastOrders = await fastOrderSchema.findOneAndDelete(
      {
        _id: body?.order_id,
        shopID: body?.authUser?._id,
      },
      { select: '-_id -createdAt -updatedAt' } // Exclude _id, createdAt, and updatedAt
    );
    console.log('existingFastOrders',existingFastOrders)
    if (!existingFastOrders) {
      return res.status(404).json({ msg: "Data Not Found with This Shop" });
    }

    const orderData = existingFastOrders.toObject();
    const orderChart = new orderchartTableSchema(orderData);
    await orderChart.save();
    try {
      const roomName = `kot_${body?.authUser?._id}`;
      if (req.io.sockets.adapter.rooms.has(roomName)) {
        req.io.to(roomName).emit("kot_Order_status_changed");
      }
    } catch (error) {
      return res.status(200).json({ msg: "Fast Order Completed" });
    }
    return res.status(200).json({ msg: "Fast Order Completed" });
  } catch (error) {
    return res.status(500).json({ msg: "Error completing fast order: " + error.message });
  }
}
// KOT

async function KOT_send_to_kitchen(req, res) {
  const body = req.body;
  try {
    const existingKotProfile = await kotUserTableSchema.findOne(
      {
        shopID: body?.shop_id,
      },
      { inventorie_id: 1, order_status: 1 }
    );
    if (existingKotProfile && body?.order_id) {
      if (existingKotProfile?.order_status !== 1) {
        await inventorieTableSchema.findOneAndUpdate(
          { shopID: body?.shop_id, _id: body?.order_id },
          { $set: { order_status: 1 } }
        );
      }
      if (!existingKotProfile.inventorie_id.includes(body?.order_id)) {
        existingKotProfile.inventorie_id.push(body?.order_id);
        await existingKotProfile.save();
        req.io
          .to(`kot_${req?.body?.shop_id}`)
          .emit("kot_newOrderArrived", { from: "1" });
        return res.status(200).json({ msg: "New Kot Added" });
      } else {
        req.io
          .to(`kot_${req?.body?.shop_id}`)
          .emit("kot_newOrderArrived", { from: "1" });
        return res
          .status(200)
          .json({ msg: "Order already present in inventorie_id" });
      }
    }
    return res.status(400).json({ msg: "Shop did not Exist" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function fastOrder_KOT_send_to_kitchen(req, res) {
  const body = req.body;
  try {
    const existingKotProfile = await kotUserTableSchema.findOne(
      {
        shopID: body?.authUser?._id,
      },
      { fastorder_inventorie_id: 1 }
    );
    if (existingKotProfile && body?.order_id) {

      if (!existingKotProfile.fastorder_inventorie_id.includes(body?.order_id)) {
        existingKotProfile.fastorder_inventorie_id.push(body?.order_id);
        await existingKotProfile.save();
        req.io
          .to(`kot_${body?.authUser?._id}`)
          .emit("kot_newOrderArrived", { from: "1" });
        return res.status(200).json({ msg: "New Kot Added" });
      } else {
        req.io
          .to(`kot_${body?.authUser?._id}`)
          .emit("kot_newOrderArrived", { from: "1" });
        return res
          .status(200)
          .json({ msg: "Order already present in Fast Order Inventories KOT" });
      }
    }
    return res.status(400).json({ msg: "Shop did not Exist" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

module.exports = {
  save_order,
  fetch_order_table_inventories,
  confirm_order,
  customer_save_inventorie,
  complete_fast_inventorie,
  save_fast_inventorie,
  KOT_send_to_kitchen,
  get_fast_orders_inventorie_list,
  cancel_fast_orders_inventorie,
  completeFastOrdersInventory,
  fastOrder_KOT_send_to_kitchen
};
