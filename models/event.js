const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const eventSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: false,
  },
  teacherName: {
    type: String,
    required: false,
  },
  teacherPhone: {
    type: Number,
    required: false,
  },
  studentName: {
    type: String,
    required: false,
  },
  studentPhone: {
    type: Number,
    required: false,
  },
  venue: {
    type: String,
    required: false,
  },
  date: {
    type: String,
    required: false,
  },
  active: {
    type: Boolean,
    required: false,
  },
  registrations: {
    type: Number,
    required: false,
    default: '0'
  },
  registration: {
    users: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: false
        },
      }
    ]
  }
});

eventSchema.methods.addTheUser = function (user) {
  const updatedRegisterEvents = [...this.registration.users];
    updatedRegisterEvents.push({
      userId: user._id,
    });
  const updatedRegister = {
    users: updatedRegisterEvents
  };
  this.registration = updatedRegister;
  return this.save();
};

module.exports = mongoose.model("Event", eventSchema);
