const mongoose = require('mongoose');

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
        required: true 
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

module.exports = mongoose.model('upcomingContest', upcomingContestSchema);
