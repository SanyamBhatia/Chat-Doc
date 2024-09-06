const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  // This is a constructor used to define the structure of documents within a MongoDB collection.
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
