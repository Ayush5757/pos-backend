const mongoose = require("mongoose");

const foodTableSche = new mongoose.Schema(
  {
    shopID: {
      type: String,
    },
    categories:[
      {
        categorie_name:{
          type: String,
          required: false
        }
      }
    ],
    foods:[
      {
        categorie_name: String,
        categorie_id: String,
        food_data: [
          {
          item_name: String,
          price: Number,
          half_price: Number,
          offer_price: Number,
          offer_half_price: Number,
          desc: String,
          photo: String,
        }
      ]
      }
    ]

  },
  { timestamps: true }
);

const foodTableSchema = mongoose.model("food", foodTableSche);

module.exports = { foodTableSchema };
