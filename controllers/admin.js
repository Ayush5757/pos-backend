const { shopTableSchema } = require("../models/table");
const { User } = require("../models/user");

async function admin_login(req, res) {
  try {
    if (req?.body?.pass !== process.env.old_age) {
      return res.status(400).json({ msg: "PassWord Incorrect" });
    }
    return res
      .status(200)
      .json({ msg: "PassWord Matched", oktoken: process.env.age_v1 });
  } catch (error) {
    return res.status(400).json({ msg: "Internal Server Error" });
  }
}

async function get_users_admin(req, res) {
  try {
    if (req?.body?.password !== process.env.age_v1) {
      return res.status(400).json({ msg: "Unauthenticated User" });
    }

    const page = parseInt(req?.body?.page) || 1; // default to page 1
    const limit = parseInt(req?.body?.limit) || 10; // default to 10 items per page

    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments({});

    const result = await User.find({}, { shopPassword: 0 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ msg: "Here", target: result, totalUsers });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error" });
  }
}

async function change_otpStatus_status_admin(req, res) {
  try {
    if (req?.body?.password !== process.env.age_v1) {
      return res.status(400).json({ msg: "Unauthenticated User" });
    }

    const updatedUser = await shopTableSchema.findOneAndUpdate(
      { shopID: req?.body?.shopID },
      { $set: { isOTPBook: req?.body?.otp_status } },
      { new: true }
    );
      console.log('updatedUser',updatedUser);
    if (!updatedUser) {
      return res.status(400).json({ msg: "User Not Found" });
    }
    return res.status(200).json({ msg: "Status Updated Table" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
}

async function change_usercomplete_status_admin(req, res) {
  try {
    if (req?.body?.password !== process.env.age_v1) {
      return res.status(400).json({ msg: "Unauthenticated User" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: req?.body?.shopID },
      { $set: { user_complete: req?.body?.complete_status } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ msg: "User Not Found" });
    }
    return res.status(200).json({ msg: "Status Updated usercomplete" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
}

module.exports = {
  admin_login,
  get_users_admin,
  change_otpStatus_status_admin,
  change_usercomplete_status_admin,
};
