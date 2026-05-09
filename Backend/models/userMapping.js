const mongoose = require('mongoose');
const { db1 } = require("../config/db");

const Schema = mongoose.Schema;

const userMappingSchema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    discordId: {
      type: String,
      required: true,
      trim: true,
    },
    vjHandle: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const UserMapping = db1.model('UserMapping', userMappingSchema);

module.exports = UserMapping;
