const mongoose = require("mongoose");
const { db2 } = require("../config/db");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },

    lastName: {
        type: String,
        default: ""
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

    ojInfo: {
        cfHandle: {
            type: String,
            default: ""
        },
        vjHandle: {
            type: String,
            default: ""
        },
        ccHandle: {
            type: String,
            default: ""
        },
        atcoderHandle: {
            type: String,
            default: ""
        },
        rating: {
            type: Number,
            default: 0
        },
        maxRating: {
            type: Number,
            default: 0
        },
        allTime: {
            type: Number,
            default: 0
        },
        lastYear: {
            type: Number,
            default: 0
        },
        lastMonth: {
            type: Number,
            default: 0
        }
    },

    regInfo: {
        phoneNumber: {
            type: String,
            default: ""
        },
        tShirtSize: {
            type: String,
            default: ""
        },
        ICPCId: {
            type: String,
            default: ""
        },
        photoLink: {
            type: String,
            default: ""
        },
        IdCardPhotoFrontLink: {
            type: String,
            default: ""
        },
        IdCardPhotoBackLink: {
            type: String,
            default: ""
        }
    },

    banned: {
        type: Boolean,
        default: false
    },

    roles: [{
        type: String
    }],

    updatedAt: {
        type: Date
    }
});

const users = db2.model('users', userSchema);

module.exports = users;