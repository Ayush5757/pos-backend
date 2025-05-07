const mongoose = require("mongoose");

const reminderSche = new mongoose.Schema(
  {
    shopID: {
      type: String,
    },
    reminders:[
      {
        reminder_message: String,
        reminder_date: String
      }
    ]
  },
  { timestamps: true }
);

const reminderSchema = mongoose.model("reminder", reminderSche);

module.exports = { reminderSchema };
