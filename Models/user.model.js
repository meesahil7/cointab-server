const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  login_error: {
    type: Number,
    default: 0,
  },
  suspect: {
    type: Boolean,
    default: false,
  },
  lock_until: {
    type: Date,
    default: null,
  },
});

const userModel = mongoose.model("user", userSchema);

module.exports = { userModel };
