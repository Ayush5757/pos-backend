const { createKotToken } = require("../constants/auth");
const { fastOrderSchema } = require("../models/fastorder");
const { inventorieTableSchema } = require("../models/inventories");
const { kotUserTableSchema } = require("../models/kotuser");
const { roomInventorieTableSchema } = require("../models/roomInventories");


async function get_user_kot(req, res) {
  const body = req.query;
  try {
    if(!body?.shopID){
      return res.status(200).json({ msg: "No Shop Present" });
    }
    const exist = await kotUserTableSchema.find({shopID: body?.shopID});
    if(!exist){
      return res.status(400).json({ msg: "No Kot User" });     
    }
    return res.status(200).json({ msg: "Kot Users",target: exist });     
  } catch (error) {
    return res.status(400).json({ msg: "somthing went wrong" });
  }
}

async function create_user_kot(req, res) {
  const body = req.body;
  try {
    if(!body?.user_name || !body?.password || !body?.authUser?._id){
      return res.status(200).json({ msg: "UserName and Password Not Correct" });
    }
    const exist = await kotUserTableSchema.findOneAndUpdate({shopID: body?.authUser?._id},
       { $set: {   
        user_name: body?.user_name,
        password: body?.password,
    }},
    { new: true });
      if(exist){
        return res.status(200).json({ msg: "Updated Existing Kot User" });     
      }

    const new_kot_user = new kotUserTableSchema({
      shopID: body?.authUser?._id,
      user_name: body?.user_name,
      password: body?.password,
    })
    await new_kot_user.save();
    return res.status(200).json({ msg: "New Kot User Created" });     
  } catch (error) {
    return res.status(400).json({ msg: "somthing went wrong" });
  }
}

async function login_user_kot(req, res) {
  const body = req.body;
  try {
   if(!body?.user_name || !body?.password){
    return res.status(400).json({ msg: "Please Enter Full Login Credentials" });
   }
   const login_details = await kotUserTableSchema.findOne({
    user_name: body?.user_name,
    password: body?.password
   },{shopID: 1, user_name: 1, _id: 1})

   if(!login_details){
    return res.status(400).json({msg: 'User Not Found'})
   }
   let data = {
    shopID: login_details?.shopID,
    _id: login_details?._id,
    user_name: login_details?.user_name
   }
   const tokenID = createKotToken(data)
   return res.status(200).json({ msg: "KOT User Token",target: tokenID,shopID:login_details?.shopID });
  } catch (error) {
    return res.status(400).json({ msg: "somthing went wrong" });
  }
}

async function delete_user_kot(req, res) {
  const body = req.body;
  try {
    if(!body?.shopID || !body?.user_id){
      return res.status(200).json({ msg: "Shop or User do not have Access to Delete" });
    }
    const isDeleted = await kotUserTableSchema.findOneAndDelete({shopID: body?.shopID, _id: body?.user_id});
   
    if(!isDeleted){
      return res.status(400).json({ msg: "Can Not Delete" });     
    }
    
    return res.status(200).json({ msg: "User Deleted Successfully" });     
  } catch (error) {
    return res.status(400).json({ msg: "somthing went wrong" });
  }
}

async function get_kot_user_inventries(req, res) {
  const body = req.body;
  try {
    if(body?.authUser?.shopID){
      const inventorieIds = await kotUserTableSchema.findOne({shopID:body?.authUser?.shopID},{inventorie_id:1,roominventorie_id:1,fastorder_inventorie_id:1});
      const KotOrderdData = await inventorieTableSchema.find({shopID: body?.authUser?.shopID, _id: { $in: inventorieIds?.inventorie_id } });
      const roomKotOrderdData = await roomInventorieTableSchema.find({shopID: body?.authUser?.shopID, _id: { $in: inventorieIds?.roominventorie_id } });
      const fastKotOrderdData = await fastOrderSchema.find({shopID: body?.authUser?.shopID, _id: { $in: inventorieIds?.fastorder_inventorie_id } });
      return res.status(200).json({ msg: "Kot Orders",target: {KotOrderdData:KotOrderdData,roomKotOrderdData:roomKotOrderdData,fastKotOrderdData:fastKotOrderdData} });
    }
  } catch (error) {
    return res.status(400).json({ msg: "somthing went wrong" });
  }
}

module.exports = {
  create_user_kot,
  get_user_kot,
  delete_user_kot,
  login_user_kot,
  get_kot_user_inventries,
  // complete_kot,
  // complete_room_kot
};
