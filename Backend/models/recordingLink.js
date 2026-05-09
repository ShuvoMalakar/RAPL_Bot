const mongoose = require('mongoose');
const { db2 } = require("../config/db");

const Schema = mongoose.Schema;

const recordingLinkSchema = new Schema(
  {
    contestId: {
      type: String,
      trim: true,
      required: true,
    },
    vjHandle: {
      type: String,
      trim: true,
      required: true,
    },
    recordingLink: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { timestamps: true },
);

const RecordingLink = db2.model('RecordingLink', recordingLinkSchema);

module.exports = RecordingLink;
