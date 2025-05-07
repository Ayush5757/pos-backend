const mongoose = require("mongoose");

const shopTableSche = new mongoose.Schema(
  {
    shopID: {
      type: String,
    },
    isOTPBook:{
      type: Number,
      default: 0
    },
    tableTypes: [
      {
          tableTypeName: {
            type: String,
            required: false
          },
      }
    ],
    tables: [
      {
        table_type: String,
        table_type_id: String,
        table_data:[
          {
            name: String,
            orderID: String,
            total: Number,
            workingTable: {
              type: Number,
              default: 1
            }
          }
        ]       
      },
    ],
  },
  { timestamps: true }
);

const shopTableSchema = mongoose.model("table", shopTableSche);

module.exports = { shopTableSchema };
