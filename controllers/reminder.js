const { reminderSchema } = require("../models/reminder");

async function add_new_reminder(req, res) {
  try {
    const existingReminder = await reminderSchema.findOne({ shopID: req?.body?.authUser?._id });

    if (existingReminder) {
      existingReminder.reminders.push({
        reminder_message: req?.body?.reminder_message,
        reminder_date: req?.body?.reminder_date,
      });
      await existingReminder.save();
    } else {
      const reminder = new reminderSchema({
        shopID: req?.body?.authUser?._id,
        reminders: [
          {
            reminder_message: req?.body?.reminder_message,
            reminder_date: req?.body?.reminder_date,
          },
        ],
      });
      await reminder.save();
    }

    return res.status(200).json({ msg: "Reminder Added" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function get_reminder(req, res) {
  const { selectDate } = req?.query;

  try {
    const shopID = req?.body?.authUser?._id;
    const pipeline = [
      { $match: { shopID } },
      { $unwind: "$reminders" }, // Unwind the reminders array
      { $match: selectDate ? { "reminders.reminder_date": selectDate } : {} },
      { $group: { _id: "$_id", reminders: { $push: "$reminders" } } },
    ];

    const existingReminder = await reminderSchema.aggregate(pipeline);

    if (existingReminder.length > 0) {
      return res.status(200).json({ msg: "Reminders", target: existingReminder[0] });
    }

    return res.status(200).json({ msg: "No Data Exist" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

  async function delete_reminder(req, res) {
    try {
      const result = await reminderSchema.updateOne(
        { shopID:req?.body?.authUser?._id },
        { $pull: { reminders: { _id: req?.body?.reminderID } } }
      );
  
      if (result.modifiedCount > 0) {
        return res.status(200).json({ msg: "Reminder deleted successfully" });
      } else {
        return res.status(404).json({ msg: "Reminder not found or could not be deleted" });
      }
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  }
module.exports = {
  add_new_reminder,
  get_reminder,
  delete_reminder
};
