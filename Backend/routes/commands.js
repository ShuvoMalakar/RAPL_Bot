const axios = require('axios');
const { handleCfhandleCommand } = require("../controllers/cfController");
/*// Function to fetch Codeforces rating
async function getCodeforcesRating(handle) {
    const url = `https://codeforces.com/api/user.info?handles=${handle}`;
    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data.status === 'OK') {
            const userInfo = data.result[0];
            return {
                handle: userInfo.handle,
                rating: userInfo.rating || 'Unrated',
                rank: userInfo.rank || 'Unknown',
                max_rating: userInfo.maxRating || 'Unknown',
                max_rank: userInfo.maxRank || 'Unknown'
            };
        } else {
            return { error: data.comment || 'Unknown error' };
        }
    } catch (error) {
        return { error: error.message };
    }
}*/

// Command handler for `cfhandle`
async function processCommands(message, desiredServerId, desiredChannelId) {
    if (message.guild.id !== desiredServerId || message.channel.id !== desiredChannelId) {
        console.log('Not from the desired server or channel.');
        return; // Ignore messages from other servers or channels
    }

    if (!message.content.startsWith('!cfhandle')) return;

    await handleCfhandleCommand(message, desiredServerId, desiredChannelId);
}

module.exports = {
    processCommands,
};