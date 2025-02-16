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
    }
});

const TFC = db1.model('TFC', TFCSchema);
module.exports = TFC;
