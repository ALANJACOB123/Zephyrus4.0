const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  events: [
    {
      event: { type: Object, required: true },
      quantity: { type: Number, required: true }
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
  created_at: Date,
});

module.exports = mongoose.model('Order', orderSchema);
