const { staffSchema } = require("../models/staff");

async function add_staff(req, res) {
  const body = req?.body;
  try {
    const existingShop = await staffSchema.findOne({
      shopID: body?.authUser?._id,
    });

    if (!existingShop) {
      const newShopStaff = new staffSchema({
        shopID: body?.authUser?._id,
        option: 10,
        staff_details: [
          {
            ...body,
            totalLeave: [],
          },
        ],
      });
      await newShopStaff.save();
      return res.status(200).json({ msg: "New Shop Staff Created", target: req?.body });
    }

    if (body?.staffMemberID) {
      const staffMember = existingShop?.staff_details?.find((staff) => staff?._id.equals(body?.staffMemberID));
      
      if (!staffMember) {
        return res.status(200).json({ msg: "Can't Find Staff Member" });
      }

      staffMember.set(body);
      await existingShop.save();
      return res.status(200).json({ msg: "Staff Updated", target: req?.body });
    }

    existingShop.staff_details.push({
      ...body,
      totalLeave: [],
    });
    await existingShop.save();

    return res.status(200).json({ msg: "New Staff Added", target: req?.body });
  } catch (error) {
    return res.status(400).json({ msg: error.message || "Internal Server Error" });
  }
}


async function get_staff_data(req, res) {
  const { page = 1, limit = 15 } = req.query;
  const body = req?.body;

  try {
    const existingShop = await staffSchema.findOne(
      { shopID: body?.authUser?._id },
      { 'staff_details.totalLeave': 0 }
    );

    if (!existingShop) {
      return res.status(200).json({ msg: "No Data" });
    }

    const staffData = existingShop.staff_details || [];
    const totalStaff = staffData.length;
    const totalPages = Math.ceil(totalStaff / limit);

    const paginatedStaffData = staffData.slice(
      (page - 1) * limit,
      page * limit
    );

    return res.status(200).json({
      msg: "Staff Data",
      target: paginatedStaffData,
      pageInfo: {
        totalItems: totalStaff,
        totalPages,
        currentPage: parseInt(page) || 1,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function get_single_staff_data(req, res) {
  const body = req?.body;
  try {
    const existingShop = await staffSchema.findOne({
      shopID: body?.authUser?._id,
    },{'staff_details.totalLeave': 0});
    if(!existingShop){
      return res.status(200).json({ msg: "No Data"});
    }

    const stafMemberData = existingShop?.staff_details?.filter((staff)=> staff?._id.equals(req?.query?.staffID))
    if(!stafMemberData){
      return res.status(200).json({ msg: "No Data Matched"});    
    }
    return res.status(200).json({ msg: "Staff Member Data" ,target: stafMemberData[0]});
  } catch (error) {
    return res.status(400).json({ msg: error });
  }
}

async function get_single_staff_leave_data(req, res) {
  const body = req?.body;
  try {
    const existingShop = await staffSchema.findOne({
      shopID: body?.authUser?._id,
    });

    if (!existingShop) {
      return res.status(200).json({ msg: "No Data" });
    }

    const staffMemberData = existingShop?.staff_details?.find((staff) => staff?._id.equals(req?.query?.staffID));

    if (!staffMemberData) {
      return res.status(200).json({ msg: "No Data Matched" });
    }

    const dateQueryParam = req?.query?.date;
    const totalLeave = staffMemberData.totalLeave || []; // Handle case where totalLeave is undefined

    const result = filterDatesByMonth(dateQueryParam, totalLeave);

    return res.status(200).json({ msg: "Leaves", target: result });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

function filterDatesByMonth(baseDate, datesArray) {
  if (!baseDate) {
    return []; // or handle as needed
  }

  const baseMonth = new Date(baseDate).getMonth();

  if (isNaN(baseMonth)) {
    return []; // or handle as needed
  }

  const filteredDates = datesArray?.filter((dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getMonth()) && date.getMonth() === baseMonth;
  });

  return filteredDates || []; // Handle case where filteredDates is undefined
}

const delete_staff_data = async (req, res) => {
  const body = req?.body;
  try {
    const existingShop = await staffSchema.findOne({
      shopID: body?.authUser?._id,
    });

    if (!existingShop) {
      return res.status(200).json({ msg: "No Data" });
    }

    const updatedShop = await staffSchema.findOneAndUpdate(
      {
        shopID: body?.authUser?._id,
      },
      {
        $pull: { staff_details: { _id: body?.staff_id } },
      },
      { new: true }
    );

    if (!updatedShop) {
      return res.status(200).json({ msg: "Staff Data not found" });
    }

    return res.status(200).json({ msg: "Staff Data", target: updatedShop });
  } catch (error) {
    return res.status(400).json({ msg: error.message || "Internal Server Error" });
  }
};

const staff_leave = async (req, res) => {
  try {
    const { body } = req;

    const existingShop = await staffSchema.findOne({ shopID: body?.authUser?._id });

    if (!existingShop) {
      return res.status(200).json({ msg: "No Data" });
    }

    const staffIndex = existingShop?.staff_details?.findIndex((staff) => staff?._id.equals(body?.staff_id));

    if (staffIndex === -1) {
      return res.status(200).json({ msg: "Staff Data not Matched" });
    }

    existingShop.staff_details[staffIndex].totalLeave.push(body?.date);
    await existingShop.save();

    return res.status(200).json({ msg: "Leave Approved" });
  } catch (error) {
    return res.status(400).json({ msg: error.message || "Internal Server Error" });
  }
};

module.exports = {
  add_staff,
  get_staff_data,
  delete_staff_data,
  get_single_staff_data,
  staff_leave,
  get_single_staff_leave_data
};
