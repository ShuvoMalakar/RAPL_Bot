require('dotenv').config();
const express = require('express');
const mongoose = require("mongoose");
const moment = require('moment-timezone');
const cron = require('node-cron');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { processCommands } = require('./routes/commands');
const { db1, db2 } = require('./config/db');
const { saveContestsToDB, logUpcomingContests } = require('./controllers/upcomingContests');
const { send5DayReminders, send2DayReminders, send1DayReminders, send2hoursReminders, send20minutesReminders } = require('./controllers/contestReminders');
const { tfc5DayReminders, tfc2DayReminders,tfc1DayReminders, tfc2hoursReminders,  tfc20minutesReminders } =require('./controllers/tfcReminder');
const {updateTFCDateFromVJContest, findHandlesWithoutRecordingLinks} = require('./controllers/tfcController');
const {RecordingLinksRem} = require('./controllers/tfcRecordingReminder');
const startBot = require('./config/bot');
const {fetchUserInfo, fetchMentionedUsers, mentionUsers,} = require('./controllers/usersController');
const  {bot_running} = require('./controllers/botRunning');

const app = express();
const port = process.env.PORT || 8080;

const requiredEnvVars = [
    'SERVER_ID', 'CHANNEL_ID', 'BOT_TOKEN', 'REMINDER_CHANNEL_ID',
    'CODECHEF_TIMEZONE', 'MONGO_URI_USER', 'TFC_CHANNEL', 'TFC_CONTROLLER_CHANNEL', 'HACK_RAPL_BOT'
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

client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Ignore messages from bots
    processCommands(message);
    ///fetchUserInfo(message);
    ///fetchMentionedUsers(message);
    ///mentionUsers(message);

});

startBot(client);

// Database Connection
Promise.all([db1.asPromise(), db2.asPromise(), startBot])
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

app.get('/', (req, res) => {
    res.send('Hello, your bot is up and running!');
});

/*app.post('/eheeee', async (req, res) => {
    try {
        await bot_running(process.env.HACK_RAPL_BOT, client, EmbedBuilder);
        res.status(200).send('Bot is running');
    } catch (error) {
        console.error('Error updating upcoming contests:', error.message);
        res.status(500).send('Internal Server Error');
    }
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
        await tfc20minutesReminders(process.env.REMINDER_CHANNEL_ID, client, EmbedBuilder);
        await tfc2hoursReminders(process.env.REMINDER_CHANNEL_ID, client, EmbedBuilder);
        await tfc1DayReminders(process.env.REMINDER_CHANNEL_ID, client, EmbedBuilder);
        await tfc2DayReminders(process.env.CHANNEL_ID, client, EmbedBuilder);
        await tfc5DayReminders(process.env.CHANNEL_ID, client, EmbedBuilder);
        await updateTFCDateFromVJContest();
        ///findHandlesWithoutRecordingLinks();
        //await fetchServerUsers(client, process.env.SERVER_ID);
        RecordingLinksRem(process.env.TFC_CHANNEL, client, EmbedBuilder);
        
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
    hackId: process.env.HACK_RAPL_BOT,
};