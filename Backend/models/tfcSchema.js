const mongoose = require('mongoose');
const moment = require('moment-timezone');
const { db1 } = require("../config/db"); 


// Define the TFC schema
const TFCSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    contestId: {
        type: Number,
    },
    duration: {
        type: String, 
        default: "3 hrs" 
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
    _1h: {
        type: Boolean,
        default: false 
    },
    _3h: {
        type: Boolean,
        default: false 
    },
    _24h: {
        type: Boolean,
        default: false 
    },
    _42h: {
        type: Boolean,
        default: false 
    },
    _48h: {
        type: Boolean,
        default: false 
    },
});

const TFC = db1.model('TFC', TFCSchema);
module.exports = TFC;
