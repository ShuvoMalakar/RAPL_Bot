 // For loading environment variables
const express = require('express');
const mongoose = require("mongoose");
const moment = require('moment-timezone');
const cron = require('node-cron');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const { processCommands } = require('./routes/commands'); // Import the new module
///const  {connectDB1, connectDB2} = require('./config/db');
const  {db1, db2} = require('./config/db');
const { saveContestsToDB, logUpcomingContests, } = require('./controllers/upContestController');
const { send5DayReminders, send2DayReminders,send1DayReminders, send2hoursReminders,  send20minutesReminders } = require('./controllers/contestReminders');
const {fetchAndLogUsers} = require('./controllers/usersController');


const app = express();
const port = process.env.PORT || 8080; // Use Render's PORT environment variable or fallback to 8080

// Ensure required environment variables are set
if ((!process.env.SERVER_ID) || (!process.env.CHANNEL_ID) || (!process.env.BOT_TOKEN) || (!process.env.REMINDER_CHANNEL_ID)|| (!process.env.CODECHEF_TIMEZONE) || (!process.env.MONGO_URI_USER)) {
    console.error('Error: Environment variables DESIRED_SERVER_ID, DESIRED_CHANNEL_ID, or BOT_TOKEN are not set.\nCheck the environment variables.');
    process.exit(1); // Exit the bot if these variables are missing
}
if ((!process.env.TFC_CHANNEL) || (!process.env.TFC_CONTROLLER_CHANNEL)) {
    console.error('Error: Environment variables TFC_CHANNEL, TFC_CONTROLLER_CHANNEL are not set.\nCheck the environment variables.');
    process.exit(1); // Exit the bot if these variables are missing
}

// Retrieve the desired server and channel IDs from environment variables
const desiredServerId = process.env.SERVER_ID;
const desiredChannelId = process.env.CHANNEL_ID;
const testChannelId = process.env.CHANNEL_ID;
const reminderdChannelId = process.env.REMINDER_CHANNEL_ID;
const codechef_timezone = process.env.CODECHEF_TIMEZONE;
const tfcChannelId = process.env.TFC_CHANNEL;
const tfcControllerId = process.env.TFC_CONTROLLER_CHANNEL;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// Discord Bot Setup
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

///const db1 = connectDB1();
//const db2 = connectDB2();




// connectDB2();


client.once('ready', () => {
    console.log('Discord bot is online!');
});

// Delegate command handling to `cfhandle.js`
client.on('messageCreate', (message) => {
    if (message.author.bot) return; // Ignore messages from bots
    processCommands(message);
});

// Login to Discord
const loginBot = client.login(process.env.BOT_TOKEN); // Ensure BOT_TOKEN is set in your environment variables

// Wrap client.login in a Promise
/*const loginBot = () => {
    return new Promise((resolve, reject) => {
        client.login(process.env.BOT_TOKEN)
            .then(() => {
                console.log('Discord bot logged in successfully!');
                resolve();
            })
            .catch((error) => {
                console.error('Error logging in to Discord:', error.message);
                reject(error);
            });
    });
};

const startApp = async () => {
    try {
        // Log in the bot
        await loginBot();

        // Connect to databases
        await Promise.all([db1.asPromise(), db2.asPromise()]);
        console.log("All databases connected!");

        // Start the Express server
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Error starting the application:', error.message);
        process.exit(1);
    }
};

startApp();*/

Promise.all([db1.asPromise(), db2.asPromise(), loginBot])
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


// Express Web Server Setup (Optional)
app.get('/', (req, res) => {
    res.send('Hello, your bot is up and running!');
});

// Start the Express server
/*app.listen(port, () => {
    console.log(`Web server listening on port ${port}`);
});*/

/*cron.schedule('* * * * *', async () => {
    logUpcomingContests();
});*/
/*setInterval(async () => {
    await saveContestsToDB();
    logUpcomingContests(desiredChannelId, client);
}, 20000); // Runs every 20 seconds*/

app.post('/upcoming-contests', async (req, res) => {
    ///await fetchAndLogUsers();
    await saveContestsToDB();
    ///await delay(1000); // 1-second delay
    logUpcomingContests(desiredChannelId, client, EmbedBuilder);
});
app.post('/contests-reminders', async (req, res) => {
    const now = moment().utc();
    console.log(`${now.toDate()}`);
    await send20minutesReminders(reminderdChannelId, client, EmbedBuilder);
    //await delay(5000); // 1-second delay
    await send2hoursReminders(reminderdChannelId, client, EmbedBuilder);
    //await delay(5000); // 1-second delay
    await send1DayReminders(reminderdChannelId, client, EmbedBuilder);
    //await delay(5000); // 1-second delay
    await send2DayReminders(testChannelId, client, EmbedBuilder);
    //await delay(5000); // 1-second delay
    await send5DayReminders(testChannelId, client, EmbedBuilder);
});



module.exports = {
    client, 
    codechef_timezone,
    desiredChannelId,
    tfcChannelId,
    tfcControllerId,
    reminderdChannelId,
    desiredServerId,
    testChannelId, 
};