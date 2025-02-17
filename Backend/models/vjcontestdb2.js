const mongoose = require('mongoose')
const { db2 } = require("../config/db");

const Schema = mongoose.Schema

const vjContestsSchema = new Schema({
    number: {
        type: Number,
        required: true
    },

    startTime:{
        type: Date,
        required: false
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
        },
        recordingLink: {
            type: String,
            required: false
        }
    }]
}, {timestamps: true})

vjContests = db2.model(`vjcontest`, vjContestsSchema)

module.exports = vjContests;