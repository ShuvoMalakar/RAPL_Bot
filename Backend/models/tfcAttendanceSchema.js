const mongoose = require('mongoose');
const { db1 } = require("../config/db");

const TFCAttendanceSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
    },
    studentId: {
        type: String,
        required: true,
    },
    vjHandle: {
        type: String,
        required: true,
    },
    roomNo: {
        type: String,
        required: true,
    },
    tfcId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TFC',
        required: true,
    },
    startingMessageTime: {
        type: Date,
    },
    startingTime: {
        type: Date,
    },
    leavingMessageTime: {
        type: Date,
    },
    leavingTime: {
        type: Date,
    },
});

const TFCAttendance = db1.model('TFCAttendance', TFCAttendanceSchema);

module.exports = TFCAttendance;
