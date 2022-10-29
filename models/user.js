const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  googleId: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true
  },
  Name: {
    type: String,
    required: false
  },
  image: {
    type: String,
    required: false
  },
  CollegeName: {
    type: String,
    required: false
  },
  Dept: {
    type: String,
    required: false
  },
  Address: {
    type: String,
    required: false
  },
  State: {
    type: String,
    required: false
  },
  PhoneNo: {
    type: Number,
    required: false
  },
  password: {
    type: String,
    required: false
  },
  resetToken: String,
  resetTokenExpiration: Date,
  spotAccess: {
    type: Boolean,
    default: false
  },
  registration: {
    events: [
      {
        eventId: {
          type: Schema.Types.ObjectId,
          ref: 'Event',
          required: true
        },
        quantity: { type: Number, required: true }
      }
    ]
  }
});

userSchema.methods.addToRegister = function (event) {
  const registerEventIndex = this.registration.events.findIndex(ce => {
    return ce.eventId.toString() === event._id.toString();
  });
  let newQuantity = 1;
  const updatedRegisterEvents = [...this.registration.events];

  if (registerEventIndex >= 0) {
    newQuantity = 1;
    updatedRegisterEvents[registerEventIndex].quantity = newQuantity;
  } else {
    updatedRegisterEvents.push({
      eventId: event._id,
      quantity: newQuantity
    });
  }
  const updatedRegister = {
    events: updatedRegisterEvents
  };
  this.registration = updatedRegister;
  return this.save()
};


userSchema.methods.removeFromRegister = function (eventId) {
  const updatedRegisterEvents = this.registration.events.filter(event => {
    return event.eventId.toString() !== eventId.toString();
  });
  this.registration.events = updatedRegisterEvents;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.registration = { events: [] };
  return this.save();
};

module.exports = mongoose.model('User', userSchema);

