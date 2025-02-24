
const mongoose = require("mongoose");
//const {db1} = require('../index');
const { db1 } = require("../config/db"); // Ensure the path is correct

const upcomingContestSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true 
    },
    startTime: {
        type: Date, 
        required: true 
    },
    link: {
        type: String,
        required: true,
        unique: true,
    },
    duration: {
        type: String, 
        required: true 
    },
    OJ: {
        type: String, 
        required: true 
    },
    _5dReminder: {
        type: Boolean,
        default: false 
    },
    _2dReminder: {
        type: Boolean,
        default: false 
    },
    _1dReminder: {
        type: Boolean,
        default: false 
    },
    _2hReminder: {
        type: Boolean,
        default: false 
    },
    _20mReminder: {
        type: Boolean,
        default: false 
    },
});

upcomingContest = db1.model('upcomingContest', upcomingContestSchema);

module.exports = upcomingContest;
