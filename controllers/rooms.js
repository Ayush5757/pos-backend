const { shopRoomSchema } = require("../models/room");


async function create_room_section(req, res) {
  const body = req.body;
  try {
    const existingShopRoom = await shopRoomSchema.findOne({
      shopID: body?.shopID,
    });
    if (!existingShopRoom) {
      const newShopRoom = new shopRoomSchema({
        shopID: body?.shopID,
        roomTypes: [
          {
            roomTypeName: body?.sectionName,
          },
        ],
      });
      await newShopRoom.save();
    } else {
      existingShopRoom.roomTypes.push({ roomTypeName: body?.sectionName });
      await existingShopRoom.save();
    }
    return res.status(200).json({ msg: "Room Section Added" });
  } catch (error) {
    return res.status(400).json({ msg: 'Somthing Went Wrong'});
  }
}

async function add_room(req, res) {
  const body = req.body;
  
  try {
    const existingShopRoom = await shopRoomSchema.findOne({
      shopID: body?.shopID,
    });
    if (!existingShopRoom) {
      return res.status(400).json({ msg: "Pls Create Room Type"});
      }else{
        const existingRoomTypeIndex = existingShopRoom?.rooms?.findIndex(
          (room) => room.room_type_id === body?.room_type_id
        );
        if(existingRoomTypeIndex !== -1){
          existingShopRoom.rooms[existingRoomTypeIndex].room_data.push({
              name: body?.room_name,
              total: 0,
              orderID: null,
          });
        }else{
          existingShopRoom.rooms.push({
            room_type: body?.room_type,
            room_type_id: body?.room_type_id,
            room_data: {
              name: body?.room_name,
              total: 0,
              orderID: null,
            },
        });
      }
      await existingShopRoom.save();
    }
    return res.status(200).json({ msg: "Room Added" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function get_room_sections(req, res) {
  const body = req.body;
  try {
    const existingRoom = await shopRoomSchema.findOne({
      shopID: body?.shopID,
    });
    if (!existingRoom) {
      return res.status(200).json({ msg: "pls add section before Room" });
    }
    return res
      .status(200)
      .json({ msg: "Room Sections", target: existingRoom?.roomTypes });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}
async function get_rooms(req, res) {
  const body = req.body;
  try {
    const existingRoom = await shopRoomSchema.findOne({
      shopID: body?.shopID,
    });
    if (!existingRoom) {
      return res.status(200).json({ msg: "No Room Exist" });
    }
    return res
      .status(200)
      .json({ msg: "Rooms", target: existingRoom?.rooms });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function change_status_of_room(req, res) {
  const body = req.body;
  try {
    const update = {
      $set: {
        "rooms.$[t].room_data.$[i].workingRoom": body?.workingRoom,
      },
    };
    const arrayFilters = [
      { "t.room_type_id": body?.room_type_id },
      { "i._id": body?.roomID },
    ];
    await shopRoomSchema.updateOne(
      {
        shopID: body?.authUser?._id,
      },
      update,
      {
        arrayFilters,
      }
    );
    return res.status(200).json({ msg: "Room Status Updated" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}



async function delete_room(req, res) {
  const body = req.body;
  try {
    const existingRoom = await shopRoomSchema.findOne({ shopID: body?.authUser?._id });
    
    if (!existingRoom) {
      return res.status(404).json({ msg: "Room not found" });
    }

    const room_type_index = existingRoom.rooms.findIndex((data) =>
      String(data.room_type_id) === String(body?.room_type_id)
    );

    if (room_type_index === -1) {
      return res.status(404).json({ msg: "Room type not found" });
    }

    const roomDataIndex = existingRoom.rooms[room_type_index].room_data.findIndex((data) =>
      String(data._id) === String(body?.roomID)
    );

    if (roomDataIndex !== -1) {
      if(roomDataIndex === 0 && existingRoom?.rooms[room_type_index]?.room_data?.length === 1){
        existingRoom.rooms.splice(room_type_index, 1);
        const type_index = existingRoom?.roomTypes.findIndex((data) => String(data?._id) === String(body?.room_type_id));
        existingRoom.roomTypes.splice(type_index, 1);
      }else{
        existingRoom.rooms[room_type_index].room_data.splice(roomDataIndex, 1);
      }
      await existingRoom.save();
      return res.status(200).json({ msg: "Room Deleted" });
    } else {
      return res.status(404).json({ msg: "Room data not found" });
    }
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

module.exports = {
    get_room_sections,
    create_room_section,
    add_room,
    get_rooms,
    delete_room,
    change_status_of_room
};
