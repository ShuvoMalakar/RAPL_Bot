const mongoose = require("mongoose");
///const {db1} = require('../index');
const { db1 } = require("../config/db"); // Ensure the path is correct

const CodeforcesUserSchema = new mongoose.Schema({
    handle: {
        type: String, 
        required: true,
        unique: true 
    },
    rating: {
        type: String, 
        default: "Unrated" 
    },
    rank: {
        type: String,
        default: "Unknown" 
    },
    maxRating: {
        type: String, 
        default: "Unknown" 
    },
    maxRank: {
        type: String, 
        default: "Unknown" 
    },
});
CodeforcesUser = db1.model("CodeforcesUser", CodeforcesUserSchema);

module.exports = CodeforcesUser;