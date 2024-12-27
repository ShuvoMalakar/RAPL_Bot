const express = require('express');
const axios = require('axios');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); // For loading environment variables

const app = express();
const port = process.env.PORT || 8080; // Use Render's PORT environment variable or fallback to 8080

// Ensure required environment variables are set
if ((!process.env.SERVER_ID) || (!process.env.CHANNEL_ID) || (!process.env.BOT_TOKEN)) {
    console.error('Error: Environment variables DESIRED_SERVER_ID or DESIRED_CHANNEL_ID or BOT_TOKEN are not set.\nCheck the environment variables.');
    process.exit(1); // Exit the bot if these variables are missing
}

// Retrieve the desired server and channel IDs from environment variables
const desiredServerId = process.env.SERVER_ID;
const desiredChannelId = process.env.CHANNEL_ID;

// Discord Bot Setup
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log('Discord bot is online!');
});

// Codeforces Rating Function
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

// Discord Bot Command to Fetch Codeforces Rating
client.on('messageCreate', async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;

    if (message.guild.id !== desiredServerId || message.channel.id !== desiredChannelId) {
        console.log('Not from the desired server or channel.')
        return; // Ignore messages from other servers or channels
    }

    // Check if the message starts with 'cfhandle'
    if (message.content.startsWith('!cfhandle')) {
        const args = message.content.split(' ');
        if (args.length < 2) {
            message.channel.send('Usage: `!cfhandle <user_handle>`');
            return;
        }

        const handle = args[1];
        const result = await getCodeforcesRating(handle);

        if (result.error) {
            message.channel.send(result.error);
        } else {
            const response = `
**Codeforces User Info:**
Handle: \`${result.handle}\`
Current Rating: \`${result.rating}\`
Current Rank: \`${result.rank}\`
Max Rating: \`${result.max_rating}\`
Max Rank: \`${result.max_rank}\`
            `;
            message.channel.send(response);
        }
    }
});

// Login to Discord
client.login(process.env.BOT_TOKEN); // Ensure BOT_TOKEN is set in your environment variables

// Express Web Server Setup (Optional)
app.get('/', (req, res) => {
    res.send('Hello, your bot is up and running!');
});

// Start the Express server
app.listen(port, () => {
    console.log(`Web server listening on port ${port}`);
});
