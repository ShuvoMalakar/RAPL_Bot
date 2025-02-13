const express = require('express');
const cron = require('node-cron');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config(); // For loading environment variables
const { processCommands } = require('./routes/commands'); // Import the new module
const connectDB = require('./config/db');
const { saveContestsToDB, logUpcomingContests, send5DayReminders } = require('./controllers/upContestController');

const app = express();
const port = process.env.PORT || 8080; // Use Render's PORT environment variable or fallback to 8080

// Ensure required environment variables are set
if ((!process.env.SERVER_ID) || (!process.env.CHANNEL_ID) || (!process.env.BOT_TOKEN) || (!process.env.REMINDER_CHANNEL_ID)|| (!process.env.CODECHEF_TIMEZONE)) {
    console.error('Error: Environment variables DESIRED_SERVER_ID, DESIRED_CHANNEL_ID, or BOT_TOKEN are not set.\nCheck the environment variables.');
    process.exit(1); // Exit the bot if these variables are missing
}

// Retrieve the desired server and channel IDs from environment variables
const desiredServerId = process.env.SERVER_ID;
const desiredChannelId = process.env.CHANNEL_ID;
const reminderdChannelId = process.env.CHANNEL_ID;
const codechef_timezone = process.env.CODECHEF_TIMEZONE;

// Discord Bot Setup
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

connectDB();

client.once('ready', () => {
    console.log('Discord bot is online!');
});

// Delegate command handling to `cfhandle.js`
client.on('messageCreate', (message) => {
    if (message.author.bot) return; // Ignore messages from bots
    processCommands(message, desiredServerId, desiredChannelId);
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

/*cron.schedule('* * * * *', async () => {
    logUpcomingContests();
});*/
/*setInterval(async () => {
    await saveContestsToDB();
    logUpcomingContests(desiredChannelId, client);
}, 20000); // Runs every 20 seconds*/

app.post('/upcoming-contests', async (req, res) => {
    await saveContestsToDB();
    await logUpcomingContests(desiredChannelId, client, EmbedBuilder);
    send5DayReminders(reminderdChannelId, client, EmbedBuilder);
});

module.exports = {client, codechef_timezone};