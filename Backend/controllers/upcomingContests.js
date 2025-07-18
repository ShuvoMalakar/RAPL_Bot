const moment = require('moment-timezone');
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const upcomingContest = require('../models/upcomingContests');
const puppeteer = require('puppeteer');
/*
async function fetchUpcomingCodechefContests() {
    let browser;
    try {
        const now = moment().tz('UTC');

        browser = await puppeteer.launch({ 
            ///executablePath:'/opt/render/.cache/puppeteer/chrome/linux-133.0.6943.53/chrome-linux64/chrome',
            ///executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
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
                    link: link,
                    startDate,
                    startTime,
                    duration,
                });
            });

            return results;
        });

        // Filter out past contests and format the start time in IST
        const upcomingContests = contests
            .map(contest => {
                const startDateTime = `${contest.startDate} ${contest.startTime}`;
                const contestStartTime = moment.tz(startDateTime, 'DD MMM YYYY HH:mm', 'UTC');//.tz('UTC');

                return {
                    name: contest.name,
                    link: contest.link,
                    startTime: contestStartTime.toDate(), // Convert to JavaScript Date object
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
*/


async function fetchUpcomingCodechefContests() {
    try {
        ///const now = moment().tz('UTC');

        const response = await axios.get("https://www.codechef.com/api/list/contests/future");
        //console.log(response.data.contests);

        const contests = response.data?.contests || [];

        const upcomingContests = contests
            .map(contest => {
                const startTimeUTC = moment.utc(contest.contest_start_date_iso);
                
                return {
                    name: contest.contest_name,
                    link: `https://www.codechef.com/${contest.contest_code}`,
                    startTime: startTimeUTC.toDate(), // Start time as JavaScript Date object
                    duration: contest.contest_duration, // Duration string (e.g., "02:00")
                };
            })
            //.filter(contest => moment(contest.startTime).isAfter(now)); // Filter future contests

        return upcomingContests;
    } catch (error) {
        console.error("Error fetching CodeChef contests:", error.message);
        return [];
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
                const durationSeconds = contest.durationSeconds;
                const durationHours = Math.floor(durationSeconds / 3600);
                const durationMinutes = Math.floor((durationSeconds % 3600) / 60);
                const duration = `${durationHours} Hrs ${durationMinutes} Mins`;

                return{
                    name: contest.name,
                    startTime: moment.unix(contest.startTimeSeconds).toDate(),
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

    try{
        // Fetch all contests stored in the database
        const storedContests = await upcomingContest.find({ OJ: 'Atcoder' });
        const upcomingContestLinks = new Set(contests.map(c => c.link)); 

        for (const contest of storedContests) {
            if (!upcomingContestLinks.has(contest.link)) {
                // If the contest is in the database but not in upcoming contests, delete it
                await upcomingContest.deleteOne({ link: contest.link });
                console.log(`Deleted old contest: ${contest.name}`);
            }
        }
    }catch (error) {
        return { error: error.message };
    }

    for (const contest of contests) {
        try{  
            await upcomingContest.findOneAndUpdate(
                { link: contest.link, OJ: "Atcoder", },
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
    }
}

async function saveCodechefContestsToDB() {
    const contests = await fetchUpcomingCodechefContests();
    if (contests.length === 0){
        console.log(`No Upcoming Codechef Contest found.`);
        return;
    }

    try{
        // Fetch all contests stored in the database
        const storedContests = await upcomingContest.find({ OJ: 'Codechef' });
        const upcomingContestLinks = new Set(contests.map(c => c.link)); 

        for (const contest of storedContests) {
            if (!upcomingContestLinks.has(contest.link)) {
                // If the contest is in the database but not in upcoming contests, delete it
                await upcomingContest.deleteOne({ link: contest.link });
                console.log(`Deleted old contest: ${contest.name}`);
            }
        }
    }catch (error) {
        return { error: error.message };
    }

    for (const contest of contests) {
        try{  
            await upcomingContest.findOneAndUpdate(
                { link: contest.link, OJ: "Codechef", },
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
    }
}

async function saveCodeforcesContestsToDB() {
    const contests = await fetchUpcomingCodeforcesContests();
    if (contests.length === 0) return;

    try{
        // Fetch all contests stored in the database
        const storedContests = await upcomingContest.find({ OJ: 'Codeforces' });
        const upcomingContestLinks = new Set(contests.map(c => c.link)); 

        for (const contest of storedContests) {
            if (!upcomingContestLinks.has(contest.link)) {
                // If the contest is in the database but not in upcoming contests, delete it
                await upcomingContest.deleteOne({ link: contest.link });
                console.log(`Deleted old contest: ${contest.name}`);
            }
        }
    }catch (error) {
        return { error: error.message };
    }

    for (const contest of contests) {
        try{  
            await upcomingContest.findOneAndUpdate(
                { link: contest.link, OJ: "Codeforces", },
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
    const maxContests = 6; // Limit to 6 contests
    if(contests.length < maxContests){
        maxContests = contests.length;
    }

    // Loop through the first 6 contests
    contests.slice(0, maxContests).forEach(contest => {
        const formattedTime = moment(contest.startTime)
            .tz('Asia/Dhaka')
            .format('DD/MM/YY h:mmA');

        discordMessage += `[${contest.name}](${contest.link})|${formattedTime}\n`;
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

module.exports = { saveContestsToDB, logUpcomingContests};
