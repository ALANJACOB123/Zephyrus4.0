const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const spotSchema = new Schema({
  events: [
    {
      event: { type: Object, required: true },
    }
  ],
  user: {
    email: {
      type: String,
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  },
  paymentDone: {
    type: String,
    required: true
  },
  created_at: Date,
});

module.exports = mongoose.model('Spot', spotSchema);
