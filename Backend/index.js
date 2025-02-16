require('dotenv').config();
const express = require('express');
const mongoose = require("mongoose");
const moment = require('moment-timezone');
const cron = require('node-cron');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { processCommands } = require('./routes/commands');
const { db1, db2 } = require('./config/db');
const { saveContestsToDB, logUpcomingContests } = require('./controllers/upContestController');
const { send5DayReminders, send2DayReminders, send1DayReminders, send2hoursReminders, send20minutesReminders } = require('./controllers/contestReminders');
///require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080; // Use Render's PORT environment variable or fallback to 8080

// Ensure required environment variables are set
const requiredEnvVars = [
    'SERVER_ID', 'CHANNEL_ID', 'BOT_TOKEN', 'REMINDER_CHANNEL_ID',
    'CODECHEF_TIMEZONE', 'MONGO_URI_USER', 'TFC_CHANNEL', 'TFC_CONTROLLER_CHANNEL'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`Error: Environment variable ${envVar} is not set.`);
        process.exit(1);
    }
}

// Discord Bot Setup
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log('Discord bot is online!');
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return; // Ignore messages from bots
    processCommands(message);
});

const startBot = async () => {
    try {
        await client.login(process.env.BOT_TOKEN);
        console.log('Discord bot logged in successfully!');
    } catch (error) {
        console.error('Error logging in to Discord:', error.message);
        process.exit(1);
    }
};

startBot();

startBot().then(() => {
    return Promise.all([db1.asPromise(), db2.asPromise()]);
}).then(() => {
    console.log("✅ All databases connected!");
    app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
    });
}).catch((err) => {
    console.error("❌ Error initializing app:", err.message);
    process.exit(1); // Stop the app if anything fails
});


// Database Connection
/*Promise.all([db1.asPromise(), db2.asPromise(), startBot])
    .then(() => {
        console.log("All databases connected!");
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to databases:", err.message);
        process.exit(1);
    });

// Express Routes
app.get('/', (req, res) => {
    res.send('Hello, your bot is up and running!');
});*/

app.post('/upcoming-contests', async (req, res) => {
    try {
        await saveContestsToDB();
        await logUpcomingContests(process.env.CHANNEL_ID, client, EmbedBuilder);
        res.status(200).send('Upcoming contests updated successfully.');
    } catch (error) {
        console.error('Error updating upcoming contests:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/contests-reminders', async (req, res) => {
    try {
        await send20minutesReminders(process.env.REMINDER_CHANNEL_ID, client, EmbedBuilder);
        await send2hoursReminders(process.env.REMINDER_CHANNEL_ID, client, EmbedBuilder);
        await send1DayReminders(process.env.REMINDER_CHANNEL_ID, client, EmbedBuilder);
        await send2DayReminders(process.env.CHANNEL_ID, client, EmbedBuilder);
        await send5DayReminders(process.env.CHANNEL_ID, client, EmbedBuilder);
        res.status(200).send('Contest reminders sent successfully.');
    } catch (error) {
        console.error('Error sending contest reminders:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = {
    client,
    codechef_timezone: process.env.CODECHEF_TIMEZONE,
    desiredChannelId: process.env.CHANNEL_ID,
    tfcChannelId: process.env.TFC_CHANNEL,
    tfcControllerId: process.env.TFC_CONTROLLER_CHANNEL,
    reminderdChannelId: process.env.REMINDER_CHANNEL_ID,
    desiredServerId: process.env.SERVER_ID,
    testChannelId: process.env.CHANNEL_ID,
};