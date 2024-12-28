const axios = require('axios');

// Function to fetch Codeforces rating
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
}

// Command handler for `cfhandle`
async function handleCfhandleCommand(message, desiredServerId, desiredChannelId) {
    if (message.guild.id !== desiredServerId || message.channel.id !== desiredChannelId) {
        console.log('Not from the desired server or channel.');
        return; // Ignore messages from other servers or channels
    }

    if (!message.content.startsWith('!cfhandle')) return;

    const args = message.content.split(' ');
    if (args.length < 2) {
        message.channel.send('Usage: `!cfhandle <user_handle>`');
        console.log('Message sent to the desired channel with command error.');
        return;
    }

    const handle = args[1];
    const result = await getCodeforcesRating(handle);

    if (result.error) {
        message.channel.send(result.error);
    } else {
        const response = `
📊 **Codeforces User Info:**
========================
🔹 **Handle:** ${result.handle}
🔹 **Current Rating:** ${result.rating}
🔹 **Current Rank:** ${result.rank}
🔹 **Max Rating:** ${result.max_rating}
🔹 **Max Rank:** ${result.max_rank}
`;

        message.channel.send(response);
        console.log('Message sent to the desired channel.');
    }
}

module.exports = {
    handleCfhandleCommand,
};
