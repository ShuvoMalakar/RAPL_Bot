/*const moment = require('moment-timezone');
const axios = require('axios');
const cheerio = require('cheerio');
const client = require('../index');

async function fetchUpcomingContests() {
    try {
        const response = await axios.get('https://atcoder.jp/contests/');
        const $ = cheerio.load(response.data);

        const contests = [];
        $('#contest-table-upcoming tbody tr').each((index, element) => {
            // Find the time link inside the first column
            const timeLink = $(element).find('td:nth-child(1) a').attr('href');

            if (!timeLink) {
                console.warn(`Time link not found for contest at index ${index}`);
                return;
            }

            // Extract timestamp from the URL (Format: iso=YYYYMMDDTHHMM)
            const isoMatch = timeLink.match(/iso=(\d{8}T\d{4})/);
            if (!isoMatch) {
                console.warn(`Invalid time format in link: ${timeLink}`);
                return;
            }

            // Convert ISO format to moment object
            const startTime = moment.tz(isoMatch[1], 'YYYYMMDDTHHmm', 'Asia/Tokyo').utc().format();

            // Extract contest name and link
            const name = $(element).find('td:nth-child(2) > a').text().trim();
            const link = `https://atcoder.jp${$(element).find('td:nth-child(2) > a').attr('href')}`;

            if (!name || !link) {
                console.warn(`Name or link not found for contest at index ${index}`);
                return;
            }

            // Add contest details to the list
            contests.push({ name, startTime, link });
        });

        return contests;
    } catch (error) {
        console.error('Error fetching AtCoder contests:', error.message);
        return [];
    }
}

async function logUpcomingContests(desiredChannelId,client) {
    const contests = await fetchUpcomingContests();

    if (contests.length === 0) {
        console.log('No upcoming AtCoder contests found.');
        return;
    }

    console.log('Upcoming AtCoder Contests:');
    let discordMessage = "**Upcoming AtCoder Contests:**\n";
    contests.forEach(contest => {
        // Convert time to Bangladesh Time (BST, UTC+6)
        const formattedTime = moment(contest.startTime)
            .tz('Asia/Dhaka') // Convert to Dhaka timezone
            .format('Do MMMM [at] h A'); // Format as "1st January at 10 PM"

        console.log(`Name: ${contest.name}`);
        console.log(`Start Time (BST): ${formattedTime}`);
        console.log(`Link: ${contest.link}`);
        console.log(`----------------------------------------`);
        discordMessage += `📢 **${contest.name}**\n🕒 **Start Time:** ${formattedTime} (BST)\n🔗Contest Link: ${contest.link}\n\n`;
       
    });
    // Send to Discord bot channel
    sendToDiscord(desiredChannelId, client, discordMessage);
};

async function sendToDiscord(desiredChannelId, client, message) {
    try {
        const channel = await client.channels.fetch(desiredChannelId);
        if (!channel) {
            console.error("❌ Could not find the Discord channel.");
            return;
        }

        await channel.send(message);
        console.log("✅ Sent to Discord successfully!");
    } catch (error) {
        console.error("❌ Error sending message to Discord:", error.message);
    }
};


module.exports = { logUpcomingContests };*/

const moment = require('moment-timezone');
const axios = require('axios');
const cheerio = require('cheerio');
//const mongoose = require('mongoose');
///const client = require('../index');
const upcomingContest = require('../models/upcomingContests'); // MongoDB model


/*async function fetchUpcomingCodechefContests() {
    try {
        // Fetch the CodeChef contests page
        const response = await axios.get('https://www.codechef.com/contests');
        const $ = cheerio.load(response.data);

        const contests = [];

        // Loop through each contest row in the table
        $('._dataTable__container_7s2sw_417 tbody tr').each((index, element) => {
            const name = $(element).find('td:nth-child(2) a span').text().trim();
            const link = `https://www.codechef.com${$(element).find('td:nth-child(2) a').attr('href')}`;
            const startDate = $(element).find('td:nth-child(3) ._start-date__container_7s2sw_457 p:nth-child(1)').text().trim();
            const startTime = $(element).find('td:nth-child(3) ._start-date__container_7s2sw_457 ._grey__text_7s2sw_462').text().trim();

            if (!name || !link || !startDate || !startTime) return;

            // Combine date and time into a single ISO 8601 timestamp
            const startDateTime = `${startDate} ${startTime}`;
            const startTimeISO = moment.tz(startDateTime, 'DD MMM YYYY HH:mm', 'Asia/Kolkata').toDate();

            contests.push({ name, link, startTime: startTimeISO });
        });

        return contests;
    } catch (error) {
        console.error('Error fetching CodeChef contests:', error.message);
        return [];
    }
}*/

const puppeteer = require('puppeteer');

async function fetchUpcomingCodechefContests() {
    let browser;
    try {
        // Launch a headless browser
        /*browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser', // Set correct path
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for running in a server environment

            ///executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',  // Path to Chromium
            headless: true,
        });*/

        browser = await puppeteer.launch({ 
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true 
        });
        const page = await browser.newPage();

        // Set desktop viewport size
        await page.setViewport({ width: 1280, height: 800 });

        // Navigate to the CodeChef contests page
        await page.goto('https://www.codechef.com/contests', { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for the contest table to load
        await page.waitForSelector('._dataTable__container_7s2sw_417', { timeout: 60000 });

        // Extract contest data
        const contests = await page.evaluate(() => {
            const results = [];
            const rows = document.querySelectorAll('._dataTable__container_7s2sw_417 tbody tr');

            rows.forEach((row) => {
                const name = row.querySelector('td:nth-child(2) a span')?.innerText.trim();
                const link = row.querySelector('td:nth-child(2) a')?.getAttribute('href');
                const startDate = row.querySelector('td:nth-child(3) ._start-date__container_7s2sw_457 p:nth-child(1)')?.innerText.trim();
                const startTime = row.querySelector('td:nth-child(3) ._start-date__container_7s2sw_457 ._grey__text_7s2sw_462')?.innerText.trim();
                const duration = row.querySelector('td:nth-child(4) ._duration__container_7s2sw_465 p')?.innerText.trim();

                if (!name || !link || !startDate || !startTime || !duration) return;

                results.push({
                    name,
                    link: `https://www.codechef.com${link}`,
                    startDate,
                    startTime,
                    duration,
                });
            });

            return results;
        });

        // Get the current time in IST
        const now = moment().tz('Asia/Dhaka');

        // Filter out past contests and format the start time in IST
        const upcomingContests = contests
            .map(contest => {
                const startDateTime = `${contest.startDate} ${contest.startTime}`;
                const contestStartTime = moment.tz(startDateTime, 'DD MMM YYYY HH:mm', 'Asia/Dhaka');

                return {
                    name: contest.name,
                    link: contest.link,
                    startTime: contestStartTime.toDate(), // Convert to JavaScript Date object
                    startTimeIST: contestStartTime.format('DD MMM YYYY, hh:mm A'), // Format in IST
                    duration: contest.duration, // Include contest duration
                };
            })
            .filter(contest => contest.startTime > now); // Keep only contests that start in the future

        return upcomingContests;
    } catch (error) {
        console.error('Error fetching CodeChef contests:', error.message);
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}


async function fetchUpcomingCodeforcesContests() {
    try {
        const response = await axios.get('https://codeforces.com/api/contest.list');
        
        if (response.data.status !== "OK") {
            throw new Error("Failed to fetch data from Codeforces API");
        }

        const contests = response.data.result
            .filter(contest => contest.phase === "BEFORE")  // Only upcoming contests
            .map(contest => {
                // Convert duration from seconds to hours and minutes
                const durationSeconds = contest.durationSeconds;
                const durationHours = Math.floor(durationSeconds / 3600);
                const durationMinutes = Math.floor((durationSeconds % 3600) / 60);
                const duration = `${durationHours} Hrs ${durationMinutes} Mins`;

                return{
                    name: contest.name,
                    startTime: moment.unix(contest.startTimeSeconds).toDate(),  // Convert timestamp to Date
                    link: `https://codeforces.com/contests/${contest.id}`,
                    duration: duration,
                }
                
            });

        return contests;
    } catch (error) {
        console.error('Error fetching Codeforces contests:', error.message);
        return [];
    }
}

async function fetchUpcomingAtcoderContests() {
    try {
        const response = await axios.get('https://atcoder.jp/contests/');
        const $ = cheerio.load(response.data);

        const contests = [];
        $('#contest-table-upcoming tbody tr').each((index, element) => {
            const timeLink = $(element).find('td:nth-child(1) a').attr('href');
            if (!timeLink) return;

            const isoMatch = timeLink.match(/iso=(\d{8}T\d{4})/);
            if (!isoMatch) return;

            // Convert to MongoDB-compatible Date format (ISO 8601)
            const startTime = moment.tz(isoMatch[1], 'YYYYMMDDTHHmm', 'Asia/Tokyo').toDate();

            const name = $(element).find('td:nth-child(2) > a').text().trim();
            const link = `https://atcoder.jp${$(element).find('td:nth-child(2) > a').attr('href')}`;

            const duration = $(element).find('td:nth-child(3)').text().trim(); // Fetch duration

            if (!name || !link || !startTime || !duration) return;

            // Break duration into hours and minutes
            const [hours, minutes] = duration.split(':').map(Number);
            const durationFormatted = `${hours} Hrs ${minutes} Mins`;


            contests.push({ name, startTime, link, duration: durationFormatted });
        });

        return contests;
    } catch (error) {
        console.error('Error fetching AtCoder contests:', error.message);
        return [];
    }
}

// 🔹 Store contests in MongoDB, avoiding duplicates
async function saveAtcoderContestsToDB() {
    const contests = await fetchUpcomingAtcoderContests();
    if (contests.length === 0) return;

    for (const contest of contests) {
        try{  
            await upcomingContest.findOneAndUpdate(
                { name: contest.name, OJ: "Atcoder", },
                {
                    name: contest.name,
                    startTime: contest.startTime,
                    link: contest.link,
                    duration: contest.duration,
                    OJ: "Atcoder",
                },
                { new: true, upsert: true }
            );
            console.log(`✅ Stored: ${contest.name}`);
        } catch (error) {
            return { error: error.message };
        }
        /*if (!existing) {
            await upcomingContest.create(contest);
            console.log(`✅ Stored: ${contest.name}`);
        } else {
            console.log(`🔹 Already exists: ${contest.name}`);
        }*/
    }
}

async function saveCodechefContestsToDB() {
    const contests = await fetchUpcomingCodechefContests();
    if (contests.length === 0){
        console.log(`No Upcoming Codechef Contest found.`);
        return;
    }

    for (const contest of contests) {
        try{  
            await upcomingContest.findOneAndUpdate(
                { name: contest.name, OJ: "Codechef", },
                {
                    name: contest.name,
                    startTime: contest.startTime,
                    link: contest.link,
                    duration: contest.duration,
                    OJ: "Codechef",
                },
                { new: true, upsert: true }
            );
            console.log(`✅ Stored: ${contest.name}`);
        } catch (error) {
            return { error: error.message };
        }
        /*if (!existing) {
            await upcomingContest.create(contest);
            console.log(`✅ Stored: ${contest.name}`);
        } else {
            console.log(`🔹 Already exists: ${contest.name}`);
        }*/
    }
}

// Function to remove past contests
async function removePastContests() {
    try {
        // Get the current time in UTC
        const now = moment().utc().toDate();

        // Delete all contests where startTime is less than the current time
        const result = await upcomingContest.deleteMany({ startTime: { $lt: now } });

        console.log(`Deleted ${result.deletedCount} past contests.`);
        return result.deletedCount; // Return the number of deleted contests
    } catch (error) {
        console.error('Error removing past contests:', error.message);
        throw error;
    }
}

async function saveCodeforcesContestsToDB() {
    const contests = await fetchUpcomingCodeforcesContests();
    if (contests.length === 0) return;

    for (const contest of contests) {
        try{  
            await upcomingContest.findOneAndUpdate(
                { name: contest.name, OJ: "Codeforces", },
                {
                    name: contest.name,
                    startTime: contest.startTime,
                    link: contest.link,
                    duration: contest.duration,
                    OJ: "Codeforces",
                },
                { new: true, upsert: true }
            );
            console.log(`✅ Stored: ${contest.name}`);
        } catch (error) {
            return { error: error.message };
        }
        /*if (!existing) {
            await upcomingContest.create(contest);
            console.log(`✅ Stored: ${contest.name}`);
        } else {
            console.log(`🔹 Already exists: ${contest.name}`);
        }*/
    }
}

async function saveContestsToDB(){
    await saveAtcoderContestsToDB();
    await saveCodeforcesContestsToDB();
    await saveCodechefContestsToDB();
    await removePastContests();
}

// 🔹 Fetch contests from MongoDB and send them to Discord

async function logUpcomingContests(desiredChannelId, client, EmbedBuilder) {
    const now = new Date();
    const contests = await upcomingContest.find({ startTime: { $gte: now } }).sort({ startTime: 1 });

    if (contests.length === 0) {
        console.log('No upcoming contests found.');
        return;
    }

    console.log('Upcoming Contests:');
    let discordMessage = '';
    const maxContests = 10; // Limit to 6 contests
    if(contests.length < maxContests){
        maxContests = contests.length;
    }

    // Loop through the first 6 contests
    contests.slice(0, maxContests).forEach(contest => {
        const formattedTime = moment(contest.startTime)
            .tz('Asia/Dhaka')
            .format('DD/MM/YY h:mmA');

        /*console.log(`Name: ${contest.name}`);
        console.log(`Start Time (BST): ${formattedTime}`);
        console.log(`Link: ${contest.link}`);
        console.log(`----------------------------------------`);*/

        discordMessage += `[${contest.name}](${contest.link})|${formattedTime}\n\n`;
    });

    // Send the message to Discord
    if (discordMessage) {
        await sendToDiscord(desiredChannelId, client, discordMessage, EmbedBuilder);
    } else {
        console.log('No contests to send to Discord.');
    }
}

// 🔹 Send contests to Discord
async function sendToDiscord(desiredChannelId, client, message, EmbedBuilder) {
    try {
        const channel = await client.channels.fetch(desiredChannelId);
        if (!channel) {
            console.error("❌ Could not find the Discord channel.");
            return; // Stop execution if the channel is not found
        }

        // Ensure the message is not too long
        if (message.length > 1024) {
            message = message.substring(0, 1024) + '...'; // Truncate the message
        }

        const embed = new EmbedBuilder()
            .setColor(0xff0000) // Red color
            .addFields(
                { name: '**Upcoming Contests:**', value: message, inline: false },
            );

        await channel.send({ embeds: [embed] });
        console.log("✅ Sent to Discord successfully!");
    } catch (error) {
        console.error("❌ Error sending message to Discord:", error.message);
    }
}


// Function to send 5-day reminders
async function send5DayReminders(desiredChannelId, client, EmbedBuilder) {
    try {
        // Get the current time in UTC
        const now = moment().utc();
        const fiveDaysLater = now.clone().add(5, 'days');

        // Find contests starting within 5 days
        const contests = await upcomingContest.find({
            startTime: {
                $gte: now.toDate(), // Contests starting after now
                $lte: fiveDaysLater.toDate(), // Contests starting within 5 days
            },
            _1dReminder: false, // Only send reminders for contests that haven't been reminded yet
        });

        // Send reminders for each contest
        for (const contest of contests) {
            const contestStartTime = moment(contest.startTime).tz('Asia/Dhaka');
            const remainingTime = moment.duration(contestStartTime.diff(now)); // Calculate remaining time

            // Format the remaining time
            const remainingDays = remainingTime.days();
            const remainingHours = remainingTime.hours();
            const remainingMinutes = remainingTime.minutes();
            const remainingTimeString = `${remainingDays}d ${remainingHours}h ${remainingMinutes}m`;

            // Create the reminder message
            const reminderMessage = `Hello @everyone\n${contest.name}\n${contestStartTime.format('DD MMM YY, HH:mm')} Asia/Dhaka | ${remainingTimeString} | ${contest.link} ◳\nAbout to start in ${remainingTimeString}\n`;

            const embed = new EmbedBuilder()
                .setColor(0xff0000) // Red color
                .setDescription(`**${contest.name}**`)
                .addFields(
                    { name:`**About to start in ${remainingTimeString}**`, value: `\`${contestStartTime.format('DD MMM YY, hh:mm A')} Asia/Dhaka | Duration: ${contest.duration} |\` [Link](${contest.link})`, inline: false },
                );

            // Send the reminder via Discord bot
            try {
                const channel = await client.channels.fetch(desiredChannelId);
                if (!channel) {
                    console.error("❌ Could not find the Discord channel.");
                    return;
                }
                ///await channel.send(reminderMessage);
                await channel.send({ content: 'Hello @everyone!', embeds: [embed] });
                console.log("✅ Sent Reminder to Discord successfully!");
            } catch (error) {
                console.error("❌ Error sending reminder to Discord:", error.message);
            }

            // Directly update the _5dReminder field in the database
            /*try {
                await upcomingContest.updateOne(
                    { name: contest.name }, // Filter by contest ID
                    { $set: { _1dReminder: true } } // Set _5dReminder to true
                );
            } catch (error) {
                console.error("❌ Error setting the _1dReminder to true:", error.message);
            }*/
        }

        console.log(`Sent ${contests.length} reminders.`);
    } catch (error) {
        console.error('Error sending reminders:', error.message);
    }
}


module.exports = { saveContestsToDB, logUpcomingContests, send5DayReminders };
