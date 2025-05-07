const { kotUserTableSchema } = require("../models/kotuser");
const { shopRoomSchema } = require("../models/room");
const { roomInventorieTableSchema } = require("../models/roomInventories");
const { roomorderchartTableSchema } = require("../models/roomorderchart");
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
        const updatedInventorie =
          await roomInventorieTableSchema.findOneAndUpdate(
            { _id: body?.order_id },
            {
              $set: {
                inventories: body?.inventories,
                note: body?.note,
                total: body?.total,
                customer: body?.customer,
                discount: body?.discount,
                addOnCharges: body?.addOnCharges,   
                roomPrice: body?.roomPrice,
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
            "rooms.$[t].room_data.$[i].total": body?.total,
          },
        };
        const arrayFilters = [
          { "t.room_type_id": body?.room_type_id },
          { "i._id": body?.room?.roomID },
        ];
        await shopRoomSchema.updateOne(
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
        const newOrder = new roomInventorieTableSchema({
          ...body,
        });
        const { _id } = await newOrder.save();

        const update = {
          $set: {
            "rooms.$[t].room_data.$[i].orderID": _id,
            "rooms.$[t].room_data.$[i].total": body?.total,
          },
        };
        const arrayFilters = [
          { "t.room_type_id": body?.room_type_id },
          { "i._id": body?.room?.roomID },
        ];
        await shopRoomSchema.updateOne(
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

async function fetch_order_room_inventories(req, res) {
  const body = req.body;
  try {
    const order_data = await roomInventorieTableSchema.findOne({
      _id: body.order_id,
    });
    if (!order_data) {
      return res.status(200).json({ msg: "No order's in this room" });
    }
    return res.status(200).json({ msg: "order details", target: order_data });
  } catch (error) {
    return res.status(200).json({ msg: "somthing went wrong" });
  }
}

async function confirm_order(req, res) {
  const body = req.body;
  try {
    const inventorieToMove = await roomInventorieTableSchema.findById(
      body?.order_id
    );
    if (!inventorieToMove) {
      return res.status(404).json({ msg: "Inventory not found" });
    }
    const orderChart = new roomorderchartTableSchema({
      ...inventorieToMove.toObject(), // Convert the Mongoose document to a plain JavaScript object
    });
    await orderChart.save();
    const isDeleted = await roomInventorieTableSchema.findByIdAndDelete(
      body?.order_id
    );

    if (!orderChart || !isDeleted) {
      return res.status(400).json({
        msg: "Confirm Failed - Unable to create order or delete inventory",
      });
    }

    const update = {
      $set: {
        "rooms.$[t].room_data.$[i].orderID": null,
        "rooms.$[t].room_data.$[i].total": 0,
      },
    };
    const arrayFilters = [
      { "t.room_type_id": body?.room_type_id },
      { "i._id": body?.room_id },
    ];
    await shopRoomSchema.updateOne(
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
      { $pull: { roominventorie_id: body?.order_id } },
      { new: true }
    );
    if (!updatedKotUser) {
      return res.status(200).json({ msg: "Kot Not Find" });
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
      const result = await roomInventorieTableSchema.findOne({
        shopID: body?.shopID,
        "room.roomID": body?.room?.roomID,
      });

      console.log("result", result);
      if (result) {
        if (result?.customer?.phone == body?.customer?.phone) {
          console.log("ayush");
          result.inventories = [...body?.inventories, ...result?.inventories];
          await result.save();
          return res
            .status(200)
            .json({ msg: "Order updated", isBooked: false });
        }
        console.log("ayush3");
        return res
          .status(200)
          .json({ msg: "Order is Already in this Room", isBooked: true });
      }
      const newOrder = new roomInventorieTableSchema({
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

async function save_fast_inventorie(req, res) {
  const body = req.body;
  try {
    const isExist = await User.exists({
      _id: body?.shopID,
    });
    if (!isExist) {
      return res.status(404).json({ msg: "User Not Found" });
    } else {
      const orderChart = new roomorderchartTableSchema({
        ...body,
      });
      await orderChart.save();
      return res.status(200).json({ msg: "Fast Order Placed" });
    }
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}
// roomorderchartTableSchema

// KOT

async function room_KOT_send_to_kitchen(req, res) {
  const body = req.body;
  try {
    const existingKotProfile = await kotUserTableSchema.findOne(
      {
        shopID: body?.shop_id,
      },
      { roominventorie_id: 1, order_status: 1 }
    );

    if (existingKotProfile && body?.order_id) {
      if (existingKotProfile?.order_status !== 1) {
        await roomInventorieTableSchema.findOneAndUpdate(
          { shopID: body?.shop_id, _id: body?.order_id },
          { $set: { order_status: 1 } }
        );
      }

      if (!existingKotProfile.roominventorie_id.includes(body?.order_id)) {
        existingKotProfile.roominventorie_id.push(body?.order_id);
        await existingKotProfile.save();
        req.io
          .to(`kot_${req?.body?.shop_id}`)
          .emit("kot_newOrderArrived", { from: 2 });
        return res.status(200).json({ msg: "New Kot Added" });
      } else {
        req.io
          .to(`kot_${req?.body?.shop_id}`)
          .emit("kot_newOrderArrived", { from: 2 });
        return res
          .status(200)
          .json({ msg: "Order already present in roominventorie_id" });
      }
    }
    return res.status(400).json({ msg: "Shop did not Exist" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

module.exports = {
  save_order,
  fetch_order_room_inventories,
  confirm_order,
  customer_save_inventorie,
  save_fast_inventorie,
  room_KOT_send_to_kitchen,
};
