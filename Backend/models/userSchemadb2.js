const mongoose = require("mongoose");
///const {db1} = require('../index');
const { db2 } = require("../config/db");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    roll: {
        type: String,
        required: true
    },

    cfHandle: {
        type: String,
        required: true
    },

    vjHandle: {
        type: String,
        required: true
    },

    ccHandle: {
        type: String,
        required: false
    },

    atcoderHandle: {
        type: String,
        required: false
    },

    password: {
        type: String,
        required: true
    },

    admin: {
        type: Boolean,
        default: false,
    },

    rating: {
        type: Number,
        default: false
    },

    maxRating: {
        type: Number,
        default: false
    },

    allTime: {
        type: Number,
        default: false
    },

    lastYear: {
        type: Number,
        default: false
    },

    lastMonth: {
        type: Number,
        default: false
    },

    resetPasswordToken : {
        type: String,
        required: false
    },

    resetPasswordExpires: {
        type: Date,
        required: false
    }

}, {timestamps: true})

const users = db2.model('users', userSchema)

module.exports = users