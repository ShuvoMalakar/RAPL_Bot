const mongoose = require('mongoose');
const { db2 } = require("../config/db");

const Schema = mongoose.Schema;

const vjContestsSchema = new Schema({
    contestId: {
        type: String,
        trim: true,
        required: true
    },

    startTime: {
        type: Date
    },

    recordingDeadline: {
        type: Number,
        default: 48
    },

    data: [{
        handle: {
            type: String,
            required: true
        },
        solved: {
            type: Number,
            required: true
        },
        penalty: {
            type: Number,
            required: true
        }
    }]
}, { timestamps: true });

const vjContests = db2.model('VJContest', vjContestsSchema);

module.exports = vjContests;