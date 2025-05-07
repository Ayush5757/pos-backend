const { shopRoomSchema } = require("../models/room");
const { roomInventorieTableSchema } = require("../models/roomInventories");
const {
  roomorderInventorieTableSchema,
} = require("../models/roomorderinventorie");

async function fetch_is_room_booked(req, res) {
  const body = req.query;
  try {
    const shopRoom = await shopRoomSchema.findOne({
      shopID: body?.shopID,
    });
    if (shopRoom) {
      const matchingRoom = shopRoom.rooms.find(
        (room) => room.room_type_id === body?.roomTypeID
      );
      console.log('matchingRoom',matchingRoom);
      if (matchingRoom) {
        const matchingRoomData = matchingRoom.room_data.find(
          (roomData) =>
            roomData._id.equals(body?.roomID) &&
            roomData.name === body?.roomName
        );
        if (matchingRoomData) {
          if (matchingRoomData?.orderID) {
            return res
              .status(200)
              .json({
                msg: "This Room is Booked Right Now Pls Wait",
                isBooked: true,
              });
          }
          if(matchingRoomData?.workingRoom === 1){
            return res
              .status(200)
              .json({ msg: "No order's in this Room", isBooked: false, isOTPBook:shopRoom?.isOTPBook});
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

    const result = await roomInventorieTableSchema.find({
      shopID: body.shopID,
      order_status: 3,
    });

    if (result.length === 0) {
      return res.status(200).json({ msg: "No Orders", target: [] });
    }

    return res.status(200).json({ msg: "Pending Orders", target: result });
  } catch (error) {
    return res.status(400).json({ msg: "Something went wrong" });
  }
}

async function get_already_booked_room_data(req, res) {
  const body = req.body;
  try {
    if (!body.shopID && !body.roomID && !body.customer) {
      return res.status(400).json({ msg: "Missing shopID in the request" });
    }

    const result = await roomInventorieTableSchema.findOne(
      {
        shopID: body.shopID,
        "room.roomID": body?.roomID,
        "customer.phone": body?.customer?.phone,
      },{inventories:1,total:1,discount:1,addOnCharges:1});
    if (!result) {
      return res.status(200).json({ msg: "No Ordered Items ", target: [] });
    }

    return res
      .status(200)
      .json({ msg: "Confirm Ordered Items", target: result });
  } catch (error) {
    return res.status(400).json({ msg: "Something went wrong" });
  }
}

async function get_pending_booked_room_data(req, res) {
  const body = req.body;
  try {
    if (!body.shopID && !body.roomID && !body.customer) {
      return res.status(400).json({ msg: "Missing shopID in the request" });
    }

    const result = await roomorderInventorieTableSchema.findOne(
      {
        shopID: body.shopID,
        "room.roomID": body?.roomID,
        "customer.phone": body?.customer?.phone,
      },
      { inventories: 1, total: 1 }
    );
    if (!result) {
      return res.status(200).json({ msg: "No Ordered Items ", target: [] });
    }

    return res
      .status(200)
      .json({ msg: "Confirm Ordered Items", target: result });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(400).json({ msg: "Something went wrong" });
  }
}
module.exports = {
  fetch_is_room_booked,
  fetch_latest_shop_orders,
  get_already_booked_room_data,
  get_pending_booked_room_data,
};
