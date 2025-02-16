const axios = require('axios');
const { handleCfhandleCommand } = require("../controllers/cfController");
/*const  {
    client, 
    codechef_timezone,
    desiredChannelId,
    tfcChannelId,
    tfcControllerId,
    reminderdChannelId,
    desiredServerId,
    testChannelId, 
} = require('../index');*/

const desiredServerId = process.env.SERVER_ID;
const desiredChannelId = process.env.CHANNEL_ID;
const testChannelId = process.env.CHANNEL_ID;
const reminderdChannelId = process.env.REMINDER_CHANNEL_ID;
const codechef_timezone = process.env.CODECHEF_TIMEZONE;
const tfcChannelId = process.env.TFC_CHANNEL;
const tfcControllerId = process.env.TFC_CONTROLLER_CHANNEL;
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
async function processCommands(message) {
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