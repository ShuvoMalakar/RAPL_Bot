const mongoose = require("mongoose");

const CodeforcesUserSchema = new mongoose.Schema({
    handle: { type: String, required: true, unique: true },
    rating: { type: String, default: "Unrated" },
    rank: { type: String, default: "Unknown" },
    maxRating: { type: String, default: "Unknown" },
    maxRank: { type: String, default: "Unknown" },
});

module.exports = mongoose.model("CodeforcesUser", CodeforcesUserSchema);