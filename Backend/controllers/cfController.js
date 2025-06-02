const axios = require("axios");
const CodeforcesUser = require("../models/cfUser");
/*
// Fetch Codeforces user info and save to MongoDB
exports.getCodeforcesUserInfo = async (handle) => {
    const url = `https://codeforces.com/api/user.info?handles=${handle}`;
    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data.status === "OK") {
            const userInfo = data.result[0];

            // Save or update user info in MongoDB
            const user = await CodeforcesUser.findOneAndUpdate(
                { handle: userInfo.handle },
                {
                    handle: userInfo.handle,
                    rating: userInfo.rating || "Unrated",
                    rank: userInfo.rank || "Unknown",
                    maxRating: userInfo.maxRating || "Unknown",
                    maxRank: userInfo.maxRank || "Unknown",
                },
                { new: true, upsert: true }
            );

            return user;
        } else {
            return { error: data.comment || "Unknown error" };
        }
    } catch (error) {
        return { error: error.message };
    }
};

// Generate a message for Discord
exports.createDiscordMessage = (user) => {
    if (!user || user.error) {
        return user.error || "An error occurred while fetching user data.";
    }

    return `
📊 **Codeforces User Info:**
========================
🔹 **Handle:** ${user.handle}
🔹 **Current Rating:** ${user.rating}
🔹 **Current Rank:** ${user.rank}
🔹 **Max Rating:** ${user.maxRating}
🔹 **Max Rank:** ${user.maxRank}
`;
};
*/

///const axios = require('axios');

// Function to fetch Codeforces rating
async function getCodeforcesRating(handle) {
    const url = `https://codeforces.com/api/user.info?handles=${handle}`;
    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data.status === 'OK') {
            const userInfo = data.result[0];
            // Save or update user info in MongoDB
            const user = await CodeforcesUser.findOneAndUpdate(
                { handle: userInfo.handle },
                {
                    handle: userInfo.handle,
                    rating: userInfo.rating || "Unrated",
                    rank: userInfo.rank || "Unknown",
                    maxRating: userInfo.maxRating || "Unknown",
                    maxRank: userInfo.maxRank || "Unknown",
                },
                { new: true, upsert: true }
            );

            return user;
        } else {
            return { error: data.comment || 'Unknown error' };
        }
    } catch (error) {
        return { error: error.message };
    }
}

async function handleCfhandleCommand(message) {

    const args = message.content.split(' ');
    if (args.length < 2) {
        message.channel.send('Usage: `!cfhandle <user_handle>`');
        //console.log('Message sent to the desired channel with command error.');
        return;
    }

    const handle = args[1];
    const result = await getCodeforcesRating(handle);

    if (result.error) {
        message.channel.send("Something went wrong");
    } else {
        const response = `
📊 **Codeforces User Info:**
========================
🔹 **Handle:** ${result.handle}
🔹 **Current Rating:** ${result.rating}
🔹 **Current Rank:** ${result.rank}
🔹 **Max Rating:** ${result.maxRating}
🔹 **Max Rank:** ${result.maxRank}
`;

        message.channel.send(response);
        


        //console.log('Message sent to the desired channel.');
    }
}

module.exports = {
    handleCfhandleCommand,
};