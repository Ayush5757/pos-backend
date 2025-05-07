const { orderchartTableSchema } = require("../models/orderchart");
const { roomorderchartTableSchema } = require("../models/roomorderchart");

async function get_order_list(req, res) {
  try {
    const { page = 1, limit = 20, selectName, selectPhone, selectDate } = req.query;

    let temp = {
      order_status: { $ne: 10 }
    };

    if (selectName) {
      temp['customer.name'] = {
        $regex: selectName,
        $options: 'i', // case-insensitive
      };
    }

    if (selectPhone) {
      temp['customer.phone'] = {
        $regex: selectPhone,
        $options: 'i', // case-insensitive
      };
    }

    if (selectDate) {
      const dateString = selectDate;
      const startDate = new Date(dateString);
      const endDate = new Date(dateString);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      const query = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
      temp = { ...query, ...temp };
    }

    const totalItems = await orderchartTableSchema.countDocuments({
      shopID: req.body.authUser?._id,
      ...temp,
    });

    const totalPages = Math.ceil(totalItems / limit);

    const result = await orderchartTableSchema
      .find(
        {
          shopID: req.body.authUser?._id,
          ...temp,
        },
        {
          total: 1,
          'customer.name': 1,
          'customer.phone': 1,
          'table.table_name': 1,
          _id: 1,
        }
      )
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // Use lean() for plain JavaScript objects

      // const uniquePhoneNumbers = new Set();
      // const filteredResults = result.filter((result) => {
      //   if (!uniquePhoneNumbers.has(result.customer.phone)) {
      //     uniquePhoneNumbers.add(result.customer.phone);
      //     return true;
      //   }
      //   return false;
      // });

    return res.status(200).json({
      msg: 'Completed Order List',
      target: result,
      pageInfo: {
        totalItems,
        totalPages,
        currentPage: parseInt(page) || 1,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}


async function get_specific_order_data(req, res) {
  try {
  const result = await orderchartTableSchema.findOne({
      shopID: req?.body?.authUser?._id,
      _id: req?.query?.orderID
    });
    return res.status(200).json({ msg: 'Completed Order All Information',target:result});
  } catch (error) {
    return res.status(400).json({ msg: error });
  }
}

async function delete_order(req, res) {
  try {
    console.log('body', req?.body);
    if (req?.body?.authUser?._id && req?.body?.order_id) {
      const updatedOrder = await orderchartTableSchema.findOneAndUpdate(
        {
          shopID: req?.body?.authUser?._id,
          _id: req?.body?.order_id,
        },
        {
          $set: { order_status: 10 },
        },
        { new: true } // Return the updated document
      );

      if (!updatedOrder) {
        return res.status(404).json({ msg: 'Order Not Found' });
      }

      return res.status(200).json({ msg: 'Order Deleted', updatedOrder });
    }
    return res.status(400).json({ msg: 'Data Not Found' });
  } catch (error) {
    return res.status(500).json({ msg: 'Error deleting order: ' + error.message });
  }
}

// Room


async function get_order_list_room(req, res) {
  try {
    const { page = 1, limit = 20, selectName, selectPhone, selectDate } = req.query;
    
    let temp = {
      order_status: { $ne: 10 }
    };

    if (selectName) {
      temp['customer.name'] = {
        $regex: selectName,
        $options: 'i', // case-insensitive
      };
    }

    if (selectPhone) {
      temp['customer.phone'] = {
        $regex: selectPhone,
        $options: 'i', // case-insensitive
      };
    }

    if (selectDate) {
      const dateString = selectDate;
      const startDate = new Date(dateString);
      const endDate = new Date(dateString);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      const query = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
      temp = { ...query, ...temp };
    }

    const totalItems = await roomorderchartTableSchema.countDocuments({
      shopID: req.body.authUser?._id,
      ...temp,
    });

    const totalPages = Math.ceil(totalItems / limit);

    const result = await roomorderchartTableSchema
      .find(
        {
          shopID: req.body.authUser?._id,
          ...temp,
        },
        {
          total: 1,
          'customer.name': 1,
          'customer.phone': 1,
          'table.table_name': 1,
          _id: 1,
        }
      )
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // Use lean() for plain JavaScript objects

    return res.status(200).json({
      msg: 'Completed Order List',
      target: result,
      pageInfo: {
        totalItems,
        totalPages,
        currentPage: parseInt(page) || 1,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}



async function get_specific_order_data_room(req, res) {
  try {
  const result = await roomorderchartTableSchema.findOne({
      shopID: req?.body?.authUser?._id,
      _id: req?.query?.orderID
    });
    return res.status(200).json({ msg: 'Completed Room Order All Information',target:result});
  } catch (error) {
    return res.status(400).json({ msg: error });
  }
}

async function delete_order_room(req, res) {
  try {
    if( req?.body?.authUser?._id &&req?.body?.order_id ){
      const updatedRoomOrder = await roomorderchartTableSchema.findOneAndUpdate(
        {
          shopID: req?.body?.authUser?._id,
          _id: req?.body?.order_id,
        },
        {
          $set: { order_status: 10 },
        },
        { new: true } // Return the updated document
      );

      if (!updatedRoomOrder) {
        return res.status(404).json({ msg: 'Order Not Found' });
      }
      return res.status(200).json({ msg: 'Room Order Deleted'});
    }
    return res.status(200).json({ msg: 'Data Not Found'});
  } catch (error) {
    return res.status(400).json({ msg: error });
  }
}

module.exports = {
  get_order_list,
  get_specific_order_data,
  delete_order,
  get_order_list_room,
  get_specific_order_data_room,
  delete_order_room
};
