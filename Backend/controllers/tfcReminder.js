const moment = require('moment-timezone');
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const TFC = require('../models/tfcSchema');
const upcomingContest = require('../models/tfcSchema');

// Function to send 5-day reminders
async function tfc5DayReminders(desiredChannelId, client, EmbedBuilder) {
    try {
        // Get the current time in UTC
        const now = moment().utc();
        const fiveDaysLater = now.clone().add(5, 'days');

        // Find contests starting within 5 days
        const contests = await TFC.find({
            date: {
                $gte: now.toDate(), // Contests starting after now
                $lte: fiveDaysLater.toDate(), // Contests starting within 5 days
            },
            _5dReminder: false, // Only send reminders for contests that haven't been reminded yet
        });

        // Send reminders for each contest
        for (const contest of contests) {
            const contestStartTime = moment(contest.date).tz('Asia/Dhaka');
            const remainingTime = moment.duration(contestStartTime.diff(now)); // Calculate remaining time

            // Format the remaining time
            const remainingDays = remainingTime.days();
            const remainingHours = remainingTime.hours();
            const remainingMinutes = remainingTime.minutes();
            const remainingTimeString = `${remainingDays}d ${remainingHours}h ${remainingMinutes}m`;

            const embed = new EmbedBuilder()
                .setColor(0xff0000) // Red color
                .setDescription(`**${contest.name}**`)
                .addFields(
                    { name:`**About to start in ${remainingTimeString}**`, value: `\`${contestStartTime.format('DD MMM YY, hh:mm A')} Asia/Dhaka | Duration: ${contest.duration} |\``, inline: false },
                );

            // Send the reminder via Discord bot
            try {
                const channel = await client.channels.fetch(desiredChannelId);
                if (!channel) {
                    console.error("❌ Could not find the Discord channel.");
                    return;
                }
                ///await channel.send(reminderMessage);
                await channel.send({ content: `${contest.name} starts in ${remainingTimeString}\n@everyone`, embeds: [embed] });
                console.log("✅ Sent Reminder to Discord successfully!");
            } catch (error) {
                console.error("❌ Error sending reminder to Discord:", error.message);
            }

            // Directly update the _5dReminder field in the database
            try {
                await TFC.updateOne(
                    { name: contest.name }, // Filter by contes
                    { $set: { _5dReminder: true } } // Set _5dReminder to true
                );
            } catch (error) {
                console.error("❌ Error setting the _5d Reminder to true:", error.message);
            }
        }

        //console.log(`Sent ${contests.length} reminders.`);
    } catch (error) {
        console.error('Error sending reminders:', error.message);
    }
}

// Function to send 2-day reminders
async function tfc2DayReminders(desiredChannelId, client, EmbedBuilder) {
    try {
        // Get the current time in UTC
        const now = moment().utc();
        const twoDaysLater = now.clone().add(2, 'days');

        // Find contests starting within 5 days
        const contests = await TFC.find({
            date: {
                $gte: now.toDate(), // Contests starting after now
                $lte: twoDaysLater.toDate(), // Contests starting within 5 days
            },
            _2dReminder: false, // Only send reminders for contests that haven't been reminded yet
        });

        // Send reminders for each contest
        for (const contest of contests) {
            const contestStartTime = moment(contest.date).tz('Asia/Dhaka');
            const remainingTime = moment.duration(contestStartTime.diff(now)); // Calculate remaining time

            // Format the remaining time
            const remainingDays = remainingTime.days();
            const remainingHours = remainingTime.hours();
            const remainingMinutes = remainingTime.minutes();
            const remainingTimeString = `${remainingDays}d ${remainingHours}h ${remainingMinutes}m`;

            const embed = new EmbedBuilder()
                .setColor(0xffa500) // Red color
                .setDescription(`**${contest.name}**`)
                .addFields(
                    { name:`**About to start in ${remainingTimeString}**`, value: `\`${contestStartTime.format('DD MMM YY, hh:mm A')} Asia/Dhaka | Duration: ${contest.duration} |\``, inline: false },
                );

            // Send the reminder via Discord bot
            try {
                const channel = await client.channels.fetch(desiredChannelId);
                if (!channel) {
                    console.error("❌ Could not find the Discord channel.");
                    return;
                }
                ///await channel.send(reminderMessage);
                await channel.send({ content: `${contest.name} starts in ${remainingTimeString}\n@everyone`, embeds: [embed] });
                console.log("✅ Sent Reminder to Discord successfully!");
            } catch (error) {
                console.error("❌ Error sending reminder to Discord:", error.message);
            }

            // Directly update the _5dReminder field in the database
            try {
                await TFC.updateOne(
                    { name: contest.name }, // Filter by contest ID
                    { 
                        $set: { 
                            _5dReminder: true, 
                            _2dReminder: true,
                        }, 
                    } // Set _5d, _2d to true
                );
            } catch (error) {
                console.error("❌ Error setting the _5d, _2d Reminder to true:", error.message);
            }
        }

        //console.log(`Sent ${contests.length} reminders.`);
    } catch (error) {
        console.error('Error sending reminders:', error.message);
    }
}

// Function to send 1-day reminders
async function tfc1DayReminders(desiredChannelId, client, EmbedBuilder) {
    try {
        // Get the current time in UTC
        const now = moment().utc();
        const oneDaysLater = now.clone().add(1, 'days');

        // Find contests starting within 5 days
        const contests = await TFC.find({
            date: {
                $gte: now.toDate(), // Contests starting after now
                $lte: oneDaysLater.toDate(), // Contests starting within 5 days
            },
            _1dReminder: false, // Only send reminders for contests that haven't been reminded yet
        });

// Send reminders for each contest
for (const contest of contests) {
    const contestStartTime = moment(contest.date).tz('Asia/Dhaka');
    const remainingTime = moment.duration(contestStartTime.diff(now)); // Calculate remaining time

    // Format the remaining time
    //const remainingDays = remainingTime.days();
    const remainingHours = remainingTime.hours();
    const remainingMinutes = remainingTime.minutes();
    const remainingTimeString = `${remainingHours}h ${remainingMinutes}m`;

    const embed = new EmbedBuilder()
        .setColor(0xffa500) // Red color
        .setDescription(`**${contest.name}**`)
        .addFields(
            { name:`**About to start in ${remainingTimeString}**`, value: `\`${contestStartTime.format('DD MMM YY, hh:mm A')} Asia/Dhaka | Duration: ${contest.duration} |\``, inline: false },
        );

    // Send the reminder via Discord bot
    try {
        const channel = await client.channels.fetch(desiredChannelId);
        if (!channel) {
            console.error("❌ Could not find the Discord channel.");
            return;
        }
        ///await channel.send(reminderMessage);
        await channel.send({ content: `${contest.name} starts in ${remainingTimeString}\n@everyone`, embeds: [embed] });
        console.log("✅ Sent Reminder to Discord successfully!");
    } catch (error) {
        console.error("❌ Error sending reminder to Discord:", error.message);
    }

    // Directly update the _5dReminder field in the database
    try {
        await TFC.updateOne(
            { name: contest.name }, // Filter by contes
                    { 
                        $set: { 
                            _5dReminder: true, 
                            _2dReminder: true,
                            _1dReminder: true,
                        }, 
                    } // Set _5d, _2d to true
                );
            } catch (error) {
                console.error("❌ Error setting the _5d, _2d, _1d Reminder to true:", error.message);
            }
        }

        //console.log(`Sent ${contests.length} reminders.`);
    } catch (error) {
        console.error('Error sending reminders:', error.message);
    }
}

// Function to send 2hours reminders
async function tfc2hoursReminders(desiredChannelId, client, EmbedBuilder) {
    try {
        // Get the current time in UTC
        const now = moment().utc();
        const twoHrsLater = now.clone().add(2, 'hours');

        // Find contests starting within 2 h hours
        const contests = await TFC.find({
            date: {
                $gte: now.toDate(), // Contests starting after now
                $lte: twoHrsLater.toDate(), // Contests starting within 2 hours
            },
            _2hReminder: false, // Only send reminders for contests that haven't been reminded yet
        });

        // Send reminders for each contest
        for (const contest of contests) {
            const contestStartTime = moment(contest.date).tz('Asia/Dhaka');
            const remainingTime = moment.duration(contestStartTime.diff(now)); // Calculate remaining time

            // Format the remaining time
            ///const remainingDays = remainingTime.days();
            const remainingHours = remainingTime.hours();
            const remainingMinutes = remainingTime.minutes();
            const remainingTimeString = `${remainingHours}h ${remainingMinutes}m`;

            const embed = new EmbedBuilder()
                .setColor(0xffa500) // Red color
                .setDescription(`**${contest.name}**`)
                .addFields(
                    { name:`**About to start in ${remainingTimeString}**`, value: `\`${contestStartTime.format('DD MMM YY, hh:mm A')} Asia/Dhaka | Duration: ${contest.duration} |\``, inline: false },
                );

            // Send the reminder via Discord bot
            try {
                const channel = await client.channels.fetch(desiredChannelId);
                if (!channel) {
                    console.error("❌ Could not find the Discord channel.");
                    return;
                }
                ///await channel.send(reminderMessage);
                await channel.send({ content: `${contest.name} starts in ${remainingTimeString}\n@everyone`, embeds: [embed] });
                console.log("✅ Sent Reminder to Discord successfully!");
            } catch (error) {
                console.error("❌ Error sending reminder to Discord:", error.message);
            }

            // Directly update the _5dReminder field in the database
            try {
                await TFC.updateOne(
                    { name: contest.name }, // Filter by contesntest ID
                    { 
                        $set: { 
                            _5dReminder: true, 
                            _2dReminder: true,
                            _1dReminder: true,
                            _2hReminder: true,
                        }, 
                    } // Set _5d, _2d, _1d, _2h to true
                );
            } catch (error) {
                console.error("❌ Error setting the _5d, _2d, _1d, _2h Reminder to true:", error.message);
            }
        }

       // console.log(`Sent ${contests.length} reminders.`);
    } catch (error) {
        console.error('Error sending reminders:', error.message);
    }
}

// Function to send 20 minutes reminders
async function tfc20minutesReminders(desiredChannelId, client, EmbedBuilder) {
    try {
        // Get the current time in UTC
        const now = moment().utc();
        const _25mLater = now.clone().add(25, 'minutes');

        // Find contests starting within 20 minutes
        const contests = await upcomingContest.find({
            date: {
                $gte: now.toDate(), // Contests starting after now
                $lte: _25mLater.toDate(), // Contests starting within 20 minutes
            },
            _20mReminder: false, // Only send reminders for contests that haven't been reminded yet
        });

        // Send reminders for each contest
        for (const contest of contests) {
            const contestStartTime = moment(contest.date).tz('Asia/Dhaka');
            const remainingTime = moment.duration(contestStartTime.diff(now)); // Calculate remaining time

            // Format the remaining time
            //const remainingDays = remainingTime.days();
            //const remainingHours = remainingTime.hours();
            const remainingMinutes = remainingTime.minutes();
            const remainingTimeString = `${remainingMinutes}m`;


        const embed = new EmbedBuilder()
            .setColor(0xffa500) // Red color
            .setDescription(`**${contest.name}**`)
            .addFields(
                { name:`**About to start in ${remainingTimeString}**`, value: `\`${contestStartTime.format('DD MMM YY, hh:mm A')} Asia/Dhaka | Duration: ${contest.duration} |\``, inline: false },
            );

        // Send the reminder via Discord bot
        try {
            const channel = await client.channels.fetch(desiredChannelId);
            if (!channel) {
                console.error("❌ Could not find the Discord channel.");
                return;
            }
            ///await channel.send(reminderMessage);
            await channel.send({ content: `${contest.name} starts in ${remainingTimeString}\n@everyone`, embeds: [embed] });
            console.log("✅ Sent Reminder to Discord successfully!");
        } catch (error) {
            console.error("❌ Error sending reminder to Discord:", error.message);
        }

        // Directly update the _5dReminder field in the database
        try {
            await TFC.updateOne(
                { name: contest.name }, // Filter by contest ID
                    { 
                        $set: { 
                            _5dReminder: true, 
                            _2dReminder: true,
                            _1dReminder: true,
                            _2hReminder: true,
                            _20mReminder: true
                        },
                    } // Set _5d, _2d, _1d, _2h to true
                );
            } catch (error) {
                console.error("❌ Error setting the _5d, _2d, _1d, _2h Reminder to true:", error.message);
            }
        }

        ///console.log(`Sent ${contests.length} reminders.`);
    } catch (error) {
        console.error('Error sending reminders:', error.message);
    }
}

module.exports = { tfc5DayReminders, tfc2DayReminders,tfc1DayReminders, tfc2hoursReminders,  tfc20minutesReminders };