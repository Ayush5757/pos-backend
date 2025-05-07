const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
    shopName:{
      type: String,
    },
    address:{
      type: String,
    },
    shopEmail:{
      type: String,
    },
    shopPassword:{
      type: String,
    },
    phone:{
      type: Number,
    },
    alt_phone:{
      type: Number,
    },
    about:{
      type: String,
    },
    shop_google_address:{
      type: String,
    },
    start_time:{
      type: String,
    },
    end_time:{
      type: String,
    },
    day_offs:[{
      type: String
    }],
    extra_time_info:{
      type: String,
    },
    waths_app_number:{
      type: Number,
    },
    status:{
      type: Number,
    },
    pincode:{
      type: String,
    },
    city:{
      type: String,
    },
    gstin: String,
    banner_image:[
      {
        photo: String
      }
    ],
    menu_instance_image:[
      {
        photo: String
      }
    ],
    barcode_instance_image:[
      {
        photo: String
      }
    ],
    user_complete:{
      type: Number,
      default: 1
    },
  },
  {timestamps: true},)
  
  const User = mongoose.model('user',usersSchema)
  
  module.exports = {User};