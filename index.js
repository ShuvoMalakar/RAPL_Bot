const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); // For loading environment variables
const { handleCfhandleCommand } = require('./commands'); // Import the new module

const app = express();
const port = process.env.PORT || 8080; // Use Render's PORT environment variable or fallback to 8080

// Ensure required environment variables are set
if ((!process.env.SERVER_ID) || (!process.env.CHANNEL_ID) || (!process.env.BOT_TOKEN)) {
    console.error('Error: Environment variables DESIRED_SERVER_ID, DESIRED_CHANNEL_ID, or BOT_TOKEN are not set.\nCheck the environment variables.');
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

// Delegate command handling to `cfhandle.js`
client.on('messageCreate', (message) => {
    if (message.author.bot) return; // Ignore messages from bots
    handleCfhandleCommand(message, desiredServerId, desiredChannelId);
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
